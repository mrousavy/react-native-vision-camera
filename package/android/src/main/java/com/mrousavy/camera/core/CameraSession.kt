package com.mrousavy.camera.core

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.ImageFormat
import android.graphics.Point
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureResult
import android.hardware.camera2.TotalCaptureResult
import android.media.Image
import android.media.ImageReader
import android.util.Log
import android.util.Size
import android.view.Surface
import android.view.SurfaceHolder
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.common.Barcode
import com.mrousavy.camera.core.capture.RepeatingCaptureRequest
import com.mrousavy.camera.core.outputs.BarcodeScannerOutput
import com.mrousavy.camera.core.outputs.PhotoOutput
import com.mrousavy.camera.core.outputs.SurfaceOutput
import com.mrousavy.camera.core.outputs.VideoPipelineOutput
import com.mrousavy.camera.extensions.closestToOrMax
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.types.Flash
import com.mrousavy.camera.types.LensFacing
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.QualityPrioritization
import com.mrousavy.camera.types.RecordVideoOptions
import com.mrousavy.camera.utils.ImageFormatUtils
import java.io.Closeable
import kotlin.coroutines.cancellation.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class CameraSession(private val context: Context, private val cameraManager: CameraManager, private val callback: Callback) :
  Closeable,
  PersistentCameraCaptureSession.Callback {
  companion object {
    private const val TAG = "CameraSession"
  }

  // Camera Configuration
  private var configuration: CameraConfiguration? = null

  // Camera State
  private val captureSession = PersistentCameraCaptureSession(cameraManager, this)
  private var photoOutput: PhotoOutput? = null
  private var videoOutput: VideoPipelineOutput? = null
  private var codeScannerOutput: BarcodeScannerOutput? = null
  private var previewView: PreviewView? = null
  private val photoOutputSynchronizer = PhotoOutputSynchronizer()
  private val mutex = Mutex()
  private var isDestroyed = false
  private var isRunning = false
    set(value) {
      if (field != value) {
        if (value) {
          callback.onStarted()
        } else {
          callback.onStopped()
        }
      }
      field = value
    }

  private val coroutineScope = CoroutineScope(CameraQueues.cameraQueue.coroutineDispatcher)

  // Video Outputs
  private var recording: RecordingSession? = null
    set(value) {
      field = value
      updateVideoOutputs()
    }

  val orientation: Orientation
    get() {
      val cameraId = configuration?.cameraId ?: return Orientation.PORTRAIT
      val characteristics = cameraManager.getCameraCharacteristics(cameraId)
      val sensorRotation = characteristics.get(CameraCharacteristics.SENSOR_ORIENTATION) ?: 0
      return Orientation.fromRotationDegrees(sensorRotation)
    }

  override fun close() {
    Log.i(TAG, "Closing CameraSession...")
    isDestroyed = true
    runBlocking {
      mutex.withLock {
        destroy()
        photoOutputSynchronizer.clear()
      }
    }
    Log.i(TAG, "CameraSession closed!")
  }

  suspend fun configure(lambda: (configuration: CameraConfiguration) -> Unit) {
    Log.i(TAG, "configure { ... }: Waiting for lock...")

    mutex.withLock {
      // Let caller configure a new configuration for the Camera.
      val config = CameraConfiguration.copyOf(this.configuration)
      lambda(config)
      val diff = CameraConfiguration.difference(this.configuration, config)
      this.configuration = config

      if (!diff.hasChanges) {
        Log.i(TAG, "Nothing changed, aborting configure { ... }")
        return@withLock
      }

      if (isDestroyed) {
        Log.i(TAG, "CameraSession is already destroyed. Skipping configure { ... }")
        return@withLock
      }

      Log.i(TAG, "configure { ... }: Updating CameraSession Configuration... $diff")

      try {
        captureSession.withConfiguration {
          // Build up session or update any props
          if (diff.deviceChanged) {
            // 1. cameraId changed, open device
            configureInput(config)
          }
          if (diff.outputsChanged) {
            // 2. outputs changed, build new session
            configureOutputs(config)
          }
          if (diff.sidePropsChanged) {
            // 3. zoom etc changed, update repeating request
            configureCaptureRequest(config)
          }
          if (diff.isActiveChanged) {
            // 4. Either start or stop the session
            val isActive = config.isActive && config.preview.isEnabled
            captureSession.setIsActive(isActive)
          }
        }

        Log.i(
          TAG,
          "configure { ... }: Completed CameraSession Configuration! (isActive: ${config.isActive}, isRunning: ${captureSession.isRunning})"
        )
        isRunning = captureSession.isRunning

        // Notify about Camera initialization
        if (diff.deviceChanged) {
          callback.onInitialized()
        }
      } catch (error: Throwable) {
        Log.e(TAG, "Failed to configure CameraSession! Error: ${error.message}, isRunning: $isRunning, Config-Diff: $diff", error)
        callback.onError(error)
      }
    }
  }

  private fun destroy() {
    Log.i(TAG, "Destroying session..")
    captureSession.close()

    photoOutput?.close()
    photoOutput = null
    videoOutput?.close()
    videoOutput = null
    codeScannerOutput?.close()
    codeScannerOutput = null

    isRunning = false
  }

  fun createPreviewView(context: Context): PreviewView {
    val previewView = PreviewView(
      context,
      object : SurfaceHolder.Callback {
        override fun surfaceCreated(holder: SurfaceHolder) {
          Log.i(TAG, "PreviewView Surface created! ${holder.surface}")
          createPreviewOutput(holder.surface)
        }

        override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
          Log.i(TAG, "PreviewView Surface updated! ${holder.surface} $width x $height")
        }

        override fun surfaceDestroyed(holder: SurfaceHolder) {
          Log.i(TAG, "PreviewView Surface destroyed! ${holder.surface}")
          destroyPreviewOutputSync()
        }
      }
    )
    this.previewView = previewView
    return previewView
  }

  private fun createPreviewOutput(surface: Surface) {
    Log.i(TAG, "Setting Preview Output...")
    coroutineScope.launch {
      configure { config ->
        config.preview = CameraConfiguration.Output.Enabled.create(CameraConfiguration.Preview(surface))
      }
    }
  }

  private fun destroyPreviewOutputSync() {
    Log.i(TAG, "Destroying Preview Output...")
    // This needs to run synchronously because after this method returns, the Preview Surface is no longer valid,
    // and trying to use it will crash. This might result in a short UI Thread freeze though.
    runBlocking {
      configure { config ->
        config.preview = CameraConfiguration.Output.Disabled.create()
      }
    }
    Log.i(TAG, "Preview Output destroyed!")
  }

  private fun configureInput(configuration: CameraConfiguration) {
    Log.i(TAG, "Configuring inputs for CameraSession...")
    val cameraId = configuration.cameraId ?: throw NoCameraDeviceError()
    val status = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
    if (status != PackageManager.PERMISSION_GRANTED) throw CameraPermissionError()
    isRunning = false
    captureSession.setInput(cameraId)
  }

  /**
   * Set up the `CaptureSession` with all outputs (preview, photo, video, codeScanner) and their HDR/Format settings.
   */
  private suspend fun configureOutputs(configuration: CameraConfiguration) {
    val cameraId = configuration.cameraId ?: throw NoCameraDeviceError()

    // Destroy previous outputs
    Log.i(TAG, "Destroying previous outputs...")
    photoOutput?.close()
    photoOutput = null
    videoOutput?.close()
    videoOutput = null
    codeScannerOutput?.close()
    codeScannerOutput = null
    isRunning = false

    val deviceDetails = CameraDeviceDetails(cameraManager, cameraId)
    val format = configuration.format

    Log.i(TAG, "Creating outputs for Camera #$cameraId...")

    val isSelfie = deviceDetails.lensFacing == LensFacing.FRONT

    val outputs = mutableListOf<SurfaceOutput>()

    // Photo Output
    val photo = configuration.photo as? CameraConfiguration.Output.Enabled<CameraConfiguration.Photo>
    if (photo != null) {
      val imageFormat = deviceDetails.photoFormat
      val sizes = deviceDetails.getPhotoSizes()
      val size = sizes.closestToOrMax(format?.photoSize)
      val maxImages = 10

      Log.i(TAG, "Adding ${size.width}x${size.height} Photo Output in ${ImageFormatUtils.imageFormatToString(imageFormat)}...")
      val imageReader = ImageReader.newInstance(size.width, size.height, imageFormat, maxImages)
      imageReader.setOnImageAvailableListener({ reader ->
        Log.i(TAG, "Photo Captured!")
        val image = reader.acquireLatestImage()
        onPhotoCaptured(image)
      }, CameraQueues.cameraQueue.handler)
      val output = PhotoOutput(imageReader, photo.config.enableHdr)
      outputs.add(output)
      photoOutput = output
    }

    // Video Output
    val video = configuration.video as? CameraConfiguration.Output.Enabled<CameraConfiguration.Video>
    if (video != null) {
      val imageFormat = video.config.pixelFormat.toImageFormat()
      val sizes = deviceDetails.getVideoSizes(imageFormat)
      val size = sizes.closestToOrMax(format?.videoSize)

      Log.i(TAG, "Adding ${size.width}x${size.height} Video Output in ${ImageFormatUtils.imageFormatToString(imageFormat)}...")
      val videoPipeline = VideoPipeline(
        size.width,
        size.height,
        video.config.pixelFormat,
        isSelfie,
        video.config.enableFrameProcessor,
        video.config.enableGpuBuffers,
        callback
      )
      val output = VideoPipelineOutput(videoPipeline, video.config.enableHdr)
      outputs.add(output)
      videoOutput = output
    }

    // Preview Output
    val preview = configuration.preview as? CameraConfiguration.Output.Enabled<CameraConfiguration.Preview>
    if (preview != null) {
      // Compute Preview Size based on chosen video size
      val videoSize = videoOutput?.size ?: format?.videoSize
      val sizes = deviceDetails.getPreviewSizes()
      val size = sizes.closestToOrMax(videoSize)

      val enableHdr = video?.config?.enableHdr ?: false

      Log.i(TAG, "Adding ${size.width}x${size.height} Preview Output...")
      val output = SurfaceOutput(
        preview.config.surface,
        size,
        SurfaceOutput.OutputType.PREVIEW,
        enableHdr
      )
      outputs.add(output)
      // Size is usually landscape, so we flip it here
      previewView?.setSurfaceSize(size.width, size.height, deviceDetails.sensorOrientation)
    }

    // CodeScanner Output
    val codeScanner = configuration.codeScanner as? CameraConfiguration.Output.Enabled<CameraConfiguration.CodeScanner>
    if (codeScanner != null) {
      if (video != null) {
        // CodeScanner and VideoPipeline are two repeating streams - they cannot be both added.
        // In this case, the user should use a Frame Processor Plugin for code scanning instead.
        throw CodeScannerTooManyOutputsError()
      }

      val imageFormat = ImageFormat.YUV_420_888
      val sizes = deviceDetails.getVideoSizes(imageFormat)
      val size = sizes.closestToOrMax(Size(1280, 720))

      Log.i(TAG, "Adding ${size.width}x${size.height} CodeScanner Output in ${ImageFormatUtils.imageFormatToString(imageFormat)}...")
      val pipeline = CodeScannerPipeline(size, imageFormat, codeScanner.config, callback)
      val output = BarcodeScannerOutput(pipeline)
      outputs.add(output)
      codeScannerOutput = output
    }

    // Create session
    captureSession.setOutputs(outputs)

    Log.i(TAG, "Successfully configured Session with ${outputs.size} outputs for Camera #$cameraId!")

    // Update Frame Processor and RecordingSession for newly changed output
    updateVideoOutputs()
  }

  private fun configureCaptureRequest(config: CameraConfiguration) {
    val video = config.video as? CameraConfiguration.Output.Enabled<CameraConfiguration.Video>
    val enableVideo = video != null
    val enableVideoHdr = video?.config?.enableHdr == true

    captureSession.setRepeatingRequest(
      RepeatingCaptureRequest(
        enableVideo,
        config.torch,
        config.fps,
        config.videoStabilizationMode,
        enableVideoHdr,
        config.enableLowLightBoost,
        config.exposure,
        config.zoom,
        config.format
      )
    )
  }

  suspend fun takePhoto(
    qualityPrioritization: QualityPrioritization,
    flash: Flash,
    enableShutterSound: Boolean,
    enableAutoStabilization: Boolean,
    enablePrecapture: Boolean,
    outputOrientation: Orientation
  ): CapturedPhoto {
    val photoOutput = photoOutput ?: throw PhotoNotEnabledError()

    Log.i(TAG, "Photo capture 1/3 - capturing ${photoOutput.size.width}x${photoOutput.size.height} image...")
    val result = captureSession.capture(
      qualityPrioritization,
      flash,
      enableAutoStabilization,
      photoOutput.enableHdr,
      outputOrientation,
      enableShutterSound,
      enablePrecapture
    )

    try {
      val timestamp = result[CaptureResult.SENSOR_TIMESTAMP]!!
      Log.i(TAG, "Photo capture 2/3 - waiting for image with timestamp $timestamp now...")
      val image = photoOutputSynchronizer.await(timestamp)

      Log.i(TAG, "Photo capture 3/3 - received ${image.width} x ${image.height} image, preparing result...")
      val deviceDetails = captureSession.getActiveDeviceDetails()
      val isMirrored = deviceDetails?.lensFacing == LensFacing.FRONT
      return CapturedPhoto(image, result, orientation, isMirrored, image.format)
    } catch (e: CancellationException) {
      throw CaptureAbortedError(false)
    }
  }

  private fun onPhotoCaptured(image: Image) {
    Log.i(TAG, "Photo captured! ${image.width} x ${image.height}")
    photoOutputSynchronizer.set(image.timestamp, image)
  }

  private fun updateVideoOutputs() {
    val videoOutput = videoOutput ?: return
    Log.i(TAG, "Updating Video Outputs...")
    videoOutput.videoPipeline.setRecordingSessionOutput(recording)
  }

  suspend fun startRecording(
    enableAudio: Boolean,
    options: RecordVideoOptions,
    callback: (video: RecordingSession.Video) -> Unit,
    onError: (error: CameraError) -> Unit
  ) {
    mutex.withLock {
      if (recording != null) throw RecordingInProgressError()
      val videoOutput = videoOutput ?: throw VideoNotEnabledError()
      val cameraId = configuration?.cameraId ?: throw NoCameraDeviceError()

      val fps = configuration?.fps ?: 30

      val recording = RecordingSession(
        context,
        cameraId,
        videoOutput.size,
        enableAudio,
        fps,
        videoOutput.enableHdr,
        orientation,
        options,
        callback,
        onError
      )
      recording.start()
      this.recording = recording
    }
  }

  suspend fun stopRecording() {
    mutex.withLock {
      val recording = recording ?: throw NoRecordingInProgressError()

      recording.stop()
      this.recording = null
    }
  }

  suspend fun pauseRecording() {
    mutex.withLock {
      val recording = recording ?: throw NoRecordingInProgressError()
      recording.pause()
    }
  }

  suspend fun resumeRecording() {
    mutex.withLock {
      val recording = recording ?: throw NoRecordingInProgressError()
      recording.resume()
    }
  }

  override fun onError(error: Throwable) {
    callback.onError(error)
  }

  suspend fun focus(x: Int, y: Int) {
    val previewView = previewView ?: throw CameraNotReadyError()
    val deviceDetails = captureSession.getActiveDeviceDetails() ?: throw CameraNotReadyError()

    val cameraPoint = previewView.convertLayerPointToCameraCoordinates(Point(x, y), deviceDetails)
    captureSession.focus(cameraPoint)
  }

  data class CapturedPhoto(
    val image: Image,
    val metadata: TotalCaptureResult,
    val orientation: Orientation,
    val isMirrored: Boolean,
    val format: Int
  ) : Closeable {
    override fun close() {
      image.close()
    }
  }

  interface Callback {
    fun onError(error: Throwable)
    fun onFrame(frame: Frame)
    fun onInitialized()
    fun onStarted()
    fun onStopped()
    fun onCodeScanned(codes: List<Barcode>, scannerFrame: CodeScannerFrame)
  }
}
