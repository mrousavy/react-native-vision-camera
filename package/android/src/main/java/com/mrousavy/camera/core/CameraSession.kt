package com.mrousavy.camera.core

import android.content.Context
import android.graphics.ImageFormat
import android.graphics.Point
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CameraMetadata
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.CaptureResult
import android.hardware.camera2.TotalCaptureResult
import android.hardware.camera2.params.MeteringRectangle
import android.hardware.camera2.params.OutputConfiguration
import android.media.Image
import android.media.ImageReader
import android.os.Build
import android.util.Log
import android.util.Range
import android.util.Size
import android.view.Surface
import android.view.SurfaceHolder
import com.google.mlkit.vision.barcode.common.Barcode
import com.mrousavy.camera.core.outputs.BarcodeScannerOutput
import com.mrousavy.camera.core.outputs.PhotoOutput
import com.mrousavy.camera.core.outputs.SurfaceOutput
import com.mrousavy.camera.core.outputs.VideoPipelineOutput
import com.mrousavy.camera.extensions.bigger
import com.mrousavy.camera.extensions.capture
import com.mrousavy.camera.extensions.closestToOrMax
import com.mrousavy.camera.extensions.createCaptureSession
import com.mrousavy.camera.extensions.createPhotoCaptureRequest
import com.mrousavy.camera.extensions.getPhotoSizes
import com.mrousavy.camera.extensions.getPreviewTargetSize
import com.mrousavy.camera.extensions.getVideoSizes
import com.mrousavy.camera.extensions.openCamera
import com.mrousavy.camera.extensions.setZoom
import com.mrousavy.camera.extensions.smaller
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.types.Flash
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.QualityPrioritization
import com.mrousavy.camera.types.Torch
import com.mrousavy.camera.types.VideoCodec
import com.mrousavy.camera.types.VideoFileType
import com.mrousavy.camera.types.VideoStabilizationMode
import java.io.Closeable
import java.util.concurrent.CancellationException
import kotlin.coroutines.CoroutineContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class CameraSession(private val context: Context, private val cameraManager: CameraManager, private val callback: CameraSessionCallback) :
  Closeable,
  CoroutineScope {
  companion object {
    private const val TAG = "CameraSession"

    // TODO: Samsung advertises 60 FPS but only allows 30 FPS for some reason.
    private val CAN_SET_FPS = !Build.MANUFACTURER.equals("samsung", true)
  }

  // Camera Configuration
  private var configuration: CameraConfiguration? = null

  // Camera State
  private var captureSession: CameraCaptureSession? = null
  private var cameraDevice: CameraDevice? = null
  private var previewRequest: CaptureRequest.Builder? = null
  private var photoOutput: PhotoOutput? = null
  private var videoOutput: VideoPipelineOutput? = null
  private var previewOutput: SurfaceOutput? = null
  private var codeScannerOutput: BarcodeScannerOutput? = null
  private var previewView: PreviewView? = null
  private val photoOutputSynchronizer = PhotoOutputSynchronizer()
  private val mutex = Mutex()
  private var isRunning = false

  override val coroutineContext: CoroutineContext
    get() = CameraQueues.cameraQueue.coroutineDispatcher

  // Video Outputs
  private var recording: RecordingSession? = null
    set(value) {
      field = value
      updateVideoOutputs()
    }
  var frameProcessor: FrameProcessor? = null
    set(value) {
      field = value
      updateVideoOutputs()
    }

  override fun close() {
    runBlocking {
      mutex.withLock {
        destroy()
        photoOutputSynchronizer.clear()
      }
    }
  }

  val orientation: Orientation
    get() {
      val cameraId = configuration?.cameraId ?: return Orientation.PORTRAIT
      val characteristics = cameraManager.getCameraCharacteristics(cameraId)
      val sensorRotation = characteristics.get(CameraCharacteristics.SENSOR_ORIENTATION) ?: 0
      return Orientation.fromRotationDegrees(sensorRotation)
    }

  suspend fun configure(lambda: (configuration: CameraConfiguration) -> Unit) {
    mutex.withLock {
      Log.i(TAG, "Updating CameraSession Configuration...")

      val config = CameraConfiguration.copyOf(this.configuration)
      lambda(config)
      val diff = CameraConfiguration.difference(this.configuration, config)

      if (!diff.hasAnyDifference) {
        Log.w(TAG, "Called configure(...) but nothing changed...")
        return
      }

      try {
        // Build up session or update any props
        if (diff.deviceChanged) {
          // 1. cameraId changed, open device
          configureCameraDevice(config)
        }
        if (diff.outputsChanged) {
          // 2. outputs changed, build new session
          configureOutputs(config)
        }
        if (diff.sidePropsChanged) {
          // 3. zoom etc changed, update repeating request
          configureCaptureRequest(config)
        }

        Log.i(TAG, "Successfully updated CameraSession Configuration! isActive: ${config.isActive}")
        this.configuration = config

        // Notify about Camera initialization
        if (diff.deviceChanged) {
          callback.onInitialized()
        }
      } catch (error: Throwable) {
        Log.e(TAG, "Failed to configure CameraSession! Error: ${error.message}, Config-Diff: $diff", error)
        callback.onError(error)
      }
    }
  }

  private fun destroy() {
    Log.i(TAG, "Destroying session..")
    captureSession?.stopRepeating()
    captureSession?.close()
    captureSession = null

    cameraDevice?.close()
    cameraDevice = null

    previewOutput?.close()
    previewOutput = null
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
    launch {
      configure { config ->
        config.preview = CameraConfiguration.Output.Enabled.create(CameraConfiguration.Preview(surface))
      }
    }
  }

  private fun destroyPreviewOutputSync() {
    Log.i(TAG, "Destroying Preview Output...")
    runBlocking {
      configure { config ->
        config.preview = CameraConfiguration.Output.Disabled.create()
      }
    }
  }

  /**
   * Set up the `CameraDevice` (`cameraId`)
   */
  private suspend fun configureCameraDevice(configuration: CameraConfiguration) {
    val cameraId = configuration.cameraId ?: throw NoCameraDeviceError()

    Log.i(TAG, "Configuring Camera #$cameraId...")

    cameraDevice?.close()
    cameraDevice = cameraManager.openCamera(cameraId, { device, error ->
      if (this.cameraDevice == device) {
        Log.e(TAG, "Camera Device $device has been disconnected!", error)
        callback.onError(error)
      } else {
        // a previous device has been disconnected, but we already have a new one.
        // this is just normal behavior
      }
    }, CameraQueues.cameraQueue)

    // Update PreviewView's Surface Size to a supported value from this Capture Device
    previewView?.resizeToInputCamera(cameraId, cameraManager, configuration.format)

    Log.i(TAG, "Successfully configured Camera #$cameraId!")
  }

  /**
   * Set up the `CaptureSession` with all outputs (preview, photo, video, codeScanner) and their HDR/Format settings.
   */
  private suspend fun configureOutputs(configuration: CameraConfiguration) {
    val cameraDevice = cameraDevice ?: throw NoCameraDeviceError()
    val characteristics = cameraManager.getCameraCharacteristics(cameraDevice.id)
    val format = configuration.format

    Log.i(TAG, "Configuring Session for Camera #${cameraDevice.id}...")

    // TODO: Do we want to skip this is this.cameraSession already contains all outputs?
    // Destroy previous CaptureSession
    captureSession?.close()
    captureSession = null
    // Destroy previous outputs
    photoOutput?.close()
    photoOutput = null
    videoOutput?.close()
    videoOutput = null
    previewOutput?.close()
    previewOutput = null
    codeScannerOutput?.close()
    codeScannerOutput = null

    val isSelfie = characteristics.get(CameraCharacteristics.LENS_FACING) == CameraCharacteristics.LENS_FACING_FRONT

    val outputs = mutableListOf<OutputConfiguration>()

    // Photo Output
    val photo = configuration.photo as? CameraConfiguration.Output.Enabled<CameraConfiguration.Photo>
    if (photo != null) {
      val imageFormat = ImageFormat.JPEG
      val sizes = characteristics.getPhotoSizes(imageFormat)
      val size = sizes.closestToOrMax(format?.photoSize)
      val maxImages = 3

      Log.i(TAG, "Adding ${size.width} x ${size.height} Photo Output in Format #$imageFormat...")
      val imageReader = ImageReader.newInstance(size.width, size.height, imageFormat, maxImages)
      imageReader.setOnImageAvailableListener({ reader ->
        Log.i(TAG, "Photo Captured!")
        val image = reader.acquireLatestImage()
        onPhotoCaptured(image)
      }, CameraQueues.cameraQueue.handler)
      val output = PhotoOutput(imageReader, configuration.enableHdr)
      outputs.add(output.toOutputConfiguration(characteristics))
      photoOutput = output
    }

    // Video Output
    val video = configuration.video as? CameraConfiguration.Output.Enabled<CameraConfiguration.Video>
    if (video != null) {
      val imageFormat = video.config.pixelFormat.toImageFormat()
      val sizes = characteristics.getVideoSizes(cameraDevice.id, imageFormat)
      val size = sizes.closestToOrMax(format?.videoSize)

      Log.i(TAG, "Adding ${size.width} x ${size.height} Video Output in Format #$imageFormat...")
      val videoPipeline = VideoPipeline(
        size.width,
        size.height,
        video.config.pixelFormat,
        isSelfie,
        video.config.enableFrameProcessor
      )
      val output = VideoPipelineOutput(videoPipeline, configuration.enableHdr)
      outputs.add(output.toOutputConfiguration(characteristics))
      videoOutput = output
    }

    // Preview Output
    val preview = configuration.preview as? CameraConfiguration.Output.Enabled<CameraConfiguration.Preview>
    if (preview != null) {
      // Compute Preview Size based on chosen video size
      val videoSize = videoOutput?.size ?: format?.videoSize
      val size = if (videoSize != null) {
        val formatAspectRatio = videoSize.bigger.toDouble() / videoSize.smaller
        characteristics.getPreviewTargetSize(formatAspectRatio)
      } else {
        characteristics.getPreviewTargetSize(null)
      }

      Log.i(TAG, "Adding ${size.width} x ${size.height} Preview Output...")
      val output = SurfaceOutput(
        preview.config.surface,
        size,
        SurfaceOutput.OutputType.PREVIEW,
        configuration.enableHdr
      )
      outputs.add(output.toOutputConfiguration(characteristics))
      previewOutput = output
      previewView?.size = size
    }

    // CodeScanner Output
    val codeScanner = configuration.codeScanner as? CameraConfiguration.Output.Enabled<CameraConfiguration.CodeScanner>
    if (codeScanner != null) {
      val imageFormat = ImageFormat.YUV_420_888
      val sizes = characteristics.getVideoSizes(cameraDevice.id, imageFormat)
      val size = sizes.closestToOrMax(Size(1280, 720))

      Log.i(TAG, "Adding ${size.width} x ${size.height} CodeScanner Output in Format #$imageFormat...")
      val pipeline = CodeScannerPipeline(size, imageFormat, codeScanner.config, callback)
      val output = BarcodeScannerOutput(pipeline)
      outputs.add(output.toOutputConfiguration(characteristics))
      codeScannerOutput = output
    }

    if (outputs.isEmpty()) {
      Log.w(TAG, "Cannot create Camera Session without any outputs. Aborting...")
      return
    }

    // Create new session
    captureSession = cameraDevice.createCaptureSession(cameraManager, outputs, { session ->
      if (this.captureSession == session) {
        Log.i(TAG, "Camera Session $session has been closed!")
        isRunning = false
      }
    }, CameraQueues.cameraQueue)

    Log.i(TAG, "Successfully configured Session with ${outputs.size} outputs for Camera #${cameraDevice.id}!")

    // Update Frame Processor and RecordingSession for newly changed output
    updateVideoOutputs()
  }

  private fun configureCaptureRequest(config: CameraConfiguration) {
    val device = cameraDevice ?: throw NoCameraDeviceError()
    val captureSession = captureSession ?: throw CameraNotReadyError()

    if (!config.isActive) {
      // TODO: Do we want to do stopRepeating() or entirely destroy the session?
      // If the Camera is not active, we don't do anything.
      captureSession.stopRepeating()
      return
    }

    val previewOutput = previewOutput
    if (previewOutput == null) {
      Log.w(TAG, "Preview Output is null, aborting...")
      return
    }

    val cameraCharacteristics = cameraManager.getCameraCharacteristics(device.id)

    val template = if (config.video.isEnabled) CameraDevice.TEMPLATE_RECORD else CameraDevice.TEMPLATE_PREVIEW
    val captureRequest = device.createCaptureRequest(template)

    captureRequest.addTarget(previewOutput.surface)
    videoOutput?.let { output ->
      captureRequest.addTarget(output.surface)
    }

    // Set FPS
    // TODO: Check if the FPS range is actually supported in the current configuration.
    val fps = config.fps
    if (fps != null && CAN_SET_FPS) {
      captureRequest.set(CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE, Range(fps, fps))
    }

    // Set Video Stabilization
    when (config.videoStabilizationMode) {
      VideoStabilizationMode.OFF -> {
        // do nothing
      }
      VideoStabilizationMode.STANDARD -> {
        // TODO: Check if that stabilization mode is even supported
        val mode = if (Build.VERSION.SDK_INT >=
          Build.VERSION_CODES.TIRAMISU
        ) {
          CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE_PREVIEW_STABILIZATION
        } else {
          CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE_ON
        }
        captureRequest.set(CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE, mode)
      }
      VideoStabilizationMode.CINEMATIC, VideoStabilizationMode.CINEMATIC_EXTENDED -> {
        // TODO: Check if that stabilization mode is even supported
        captureRequest.set(CaptureRequest.LENS_OPTICAL_STABILIZATION_MODE, CaptureRequest.LENS_OPTICAL_STABILIZATION_MODE_ON)
      }
    }

    // Set HDR
    // TODO: Check if that value is even supported
    if (config.enableHdr) {
      captureRequest.set(CaptureRequest.CONTROL_SCENE_MODE, CaptureRequest.CONTROL_SCENE_MODE_HDR)
    } else if (config.enableLowLightBoost) {
      captureRequest.set(CaptureRequest.CONTROL_SCENE_MODE, CaptureRequest.CONTROL_SCENE_MODE_NIGHT)
    }

    // Set Zoom
    // TODO: Check if that zoom value is even supported
    captureRequest.setZoom(config.zoom, cameraCharacteristics)

    // Set Torch
    // TODO: Check if torch is even supported
    if (config.torch == Torch.ON) {
      captureRequest.set(CaptureRequest.FLASH_MODE, CaptureRequest.FLASH_MODE_TORCH)
    }

    // Start repeating request if the Camera is active
    val request = captureRequest.build()
    captureSession.setRepeatingRequest(request, null, null)
  }

  suspend fun takePhoto(
    qualityPrioritization: QualityPrioritization,
    flashMode: Flash,
    enableShutterSound: Boolean,
    enableRedEyeReduction: Boolean,
    enableAutoStabilization: Boolean,
    outputOrientation: Orientation
  ): CapturedPhoto {
    val captureSession = captureSession ?: throw CameraNotReadyError()
    val photoOutput = photoOutput ?: throw PhotoNotEnabledError()

    Log.i(TAG, "Photo capture 0/3 - preparing capture request (${photoOutput.size.width}x${photoOutput.size.height})...")

    val zoom = configuration?.zoom ?: 1f

    val cameraCharacteristics = cameraManager.getCameraCharacteristics(captureSession.device.id)
    val orientation = outputOrientation.toSensorRelativeOrientation(cameraCharacteristics)
    val captureRequest = captureSession.device.createPhotoCaptureRequest(
      cameraManager,
      photoOutput.surface,
      zoom,
      qualityPrioritization,
      flashMode,
      enableRedEyeReduction,
      enableAutoStabilization,
      orientation
    )
    Log.i(TAG, "Photo capture 1/3 - starting capture...")
    val result = captureSession.capture(captureRequest, enableShutterSound)
    val timestamp = result[CaptureResult.SENSOR_TIMESTAMP]!!
    Log.i(TAG, "Photo capture 2/3 complete - received metadata with timestamp $timestamp")
    try {
      val image = photoOutputSynchronizer.await(timestamp)

      val isMirrored = cameraCharacteristics.get(CameraCharacteristics.LENS_FACING) == CameraCharacteristics.LENS_FACING_FRONT

      Log.i(TAG, "Photo capture 3/3 complete - received ${image.width} x ${image.height} image.")
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
    videoOutput.videoPipeline.setFrameProcessorOutput(frameProcessor)
    videoOutput.videoPipeline.setRecordingSessionOutput(recording)
  }

  suspend fun startRecording(
    enableAudio: Boolean,
    codec: VideoCodec,
    fileType: VideoFileType,
    bitRate: Double?,
    callback: (video: RecordingSession.Video) -> Unit,
    onError: (error: RecorderError) -> Unit
  ) {
    mutex.withLock {
      if (recording != null) throw RecordingInProgressError()
      val videoOutput = videoOutput ?: throw VideoNotEnabledError()

      val fps = configuration?.fps ?: 30

      val recording =
        RecordingSession(context, videoOutput.size, enableAudio, fps, codec, orientation, fileType, bitRate, callback, onError)
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

  suspend fun focus(x: Int, y: Int) {
    val captureSession = captureSession ?: throw CameraNotReadyError()
    val previewOutput = previewOutput ?: throw CameraNotReadyError()
    val characteristics = cameraManager.getCameraCharacteristics(captureSession.device.id)
    val sensorSize = characteristics.get(CameraCharacteristics.SENSOR_INFO_ACTIVE_ARRAY_SIZE)!!
    val previewSize = previewOutput.size
    val pX = x.toDouble() / previewSize.width * sensorSize.height()
    val pY = y.toDouble() / previewSize.height * sensorSize.width()
    val point = Point(pX.toInt(), pY.toInt())

    Log.i(TAG, "Focusing (${point.x}, ${point.y})...")
    focus(point)
  }

  private suspend fun focus(point: Point) {
    mutex.withLock {
      // TODO: Fix this method
      val captureSession = captureSession ?: throw CameraNotReadyError()
      val request = previewRequest ?: throw CameraNotReadyError()

      val weight = MeteringRectangle.METERING_WEIGHT_MAX - 1
      val focusAreaTouch = MeteringRectangle(point, Size(150, 150), weight)

      // Quickly pause preview
      captureSession.stopRepeating()

      request.set(CaptureRequest.CONTROL_AF_TRIGGER, CameraMetadata.CONTROL_AF_TRIGGER_CANCEL)
      request.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_OFF)
      captureSession.capture(request.build(), null, null)

      // Add AF trigger with focus region
      val characteristics = cameraManager.getCameraCharacteristics(captureSession.device.id)
      val maxSupportedFocusRegions = characteristics.get(CameraCharacteristics.CONTROL_MAX_REGIONS_AE) ?: 0
      if (maxSupportedFocusRegions >= 1) {
        request.set(CaptureRequest.CONTROL_AF_REGIONS, arrayOf(focusAreaTouch))
      }
      request.set(CaptureRequest.CONTROL_MODE, CameraMetadata.CONTROL_MODE_AUTO)
      request.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_AUTO)
      request.set(CaptureRequest.CONTROL_AF_TRIGGER, CameraMetadata.CONTROL_AF_TRIGGER_START)

      captureSession.capture(request.build(), false)

      // Resume preview
      request.set(CaptureRequest.CONTROL_AF_TRIGGER, CaptureRequest.CONTROL_AF_TRIGGER_IDLE)
      captureSession.setRepeatingRequest(request.build(), null, null)
    }
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

  interface CameraSessionCallback {
    fun onError(error: Throwable)
    fun onInitialized()
    fun onCodeScanned(codes: List<Barcode>)
  }
}
