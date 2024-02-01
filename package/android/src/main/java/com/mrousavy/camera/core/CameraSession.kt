package com.mrousavy.camera.core

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
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
import android.media.Image
import android.media.ImageReader
import android.os.Build
import android.util.Log
import android.util.Range
import android.util.Size
import android.view.Surface
import android.view.SurfaceHolder
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.common.Barcode
import com.mrousavy.camera.core.outputs.BarcodeScannerOutput
import com.mrousavy.camera.core.outputs.PhotoOutput
import com.mrousavy.camera.core.outputs.SurfaceOutput
import com.mrousavy.camera.core.outputs.VideoPipelineOutput
import com.mrousavy.camera.extensions.capture
import com.mrousavy.camera.extensions.closestToOrMax
import com.mrousavy.camera.extensions.createCaptureSession
import com.mrousavy.camera.extensions.createPhotoCaptureRequest
import com.mrousavy.camera.extensions.getPhotoSizes
import com.mrousavy.camera.extensions.getPreviewTargetSize
import com.mrousavy.camera.extensions.getVideoSizes
import com.mrousavy.camera.extensions.openCamera
import com.mrousavy.camera.extensions.setZoom
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.types.Flash
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.QualityPrioritization
import com.mrousavy.camera.types.RecordVideoOptions
import com.mrousavy.camera.types.Torch
import com.mrousavy.camera.types.VideoStabilizationMode
import com.mrousavy.camera.utils.ImageFormatUtils
import java.io.Closeable
import java.lang.IllegalStateException
import java.util.concurrent.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class CameraSession(private val context: Context, private val cameraManager: CameraManager, private val callback: Callback) :
  CameraManager.AvailabilityCallback(),
  Closeable {
  companion object {
    private const val TAG = "CameraSession"
  }

  // Camera Configuration
  private var configuration: CameraConfiguration? = null

  // Camera State
  private var cameraDevice: CameraDevice? = null
    set(value) {
      field = value
      cameraDeviceDetails = if (value != null) CameraDeviceDetails(cameraManager, value.id) else null
    }
  private var cameraDeviceDetails: CameraDeviceDetails? = null
  private var captureSession: CameraCaptureSession? = null
  private var previewRequest: CaptureRequest.Builder? = null
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

  init {
    cameraManager.registerAvailabilityCallback(this, CameraQueues.cameraQueue.handler)
  }

  override fun close() {
    Log.i(TAG, "Closing CameraSession...")
    isDestroyed = true
    cameraManager.unregisterAvailabilityCallback(this)
    runBlocking {
      mutex.withLock {
        destroy()
        photoOutputSynchronizer.clear()
      }
    }
    Log.i(TAG, "CameraSession closed!")
  }

  override fun onCameraAvailable(cameraId: String) {
    super.onCameraAvailable(cameraId)
    if (this.configuration?.cameraId == cameraId && cameraDevice == null && configuration?.isActive == true) {
      Log.i(TAG, "Camera #$cameraId is now available again, trying to re-open it now...")
      coroutineScope.launch {
        configure {
          // re-open CameraDevice if needed
        }
      }
    }
  }

  suspend fun configure(lambda: (configuration: CameraConfiguration) -> Unit) {
    Log.i(TAG, "configure { ... }: Waiting for lock...")

    mutex.withLock {
      // Let caller configure a new configuration for the Camera.
      val config = CameraConfiguration.copyOf(this.configuration)
      lambda(config)
      val diff = CameraConfiguration.difference(this.configuration, config)

      if (isDestroyed) {
        Log.i(TAG, "CameraSession is already destroyed. Skipping configure { ... }")
        return@withLock
      }

      Log.i(TAG, "configure { ... }: Updating CameraSession Configuration... $diff")

      try {
        val needsRebuild = cameraDevice == null || captureSession == null
        if (needsRebuild) {
          Log.i(TAG, "Need to rebuild CameraDevice and CameraCaptureSession...")
        }

        // Since cameraDevice and captureSession are OS resources, we have three possible paths here:
        if (needsRebuild) {
          if (config.isActive) {
            // A: The Camera has been torn down by the OS and we want it to be active - rebuild everything
            Log.i(TAG, "Need to rebuild CameraDevice and CameraCaptureSession...")
            configureCameraDevice(config)
            configureOutputs(config)
            configureCaptureRequest(config)
          } else {
            // B: The Camera has been torn down by the OS but it's currently in the background - ignore this
            Log.i(TAG, "CameraDevice and CameraCaptureSession is torn down but Camera is not active, skipping update...")
          }
        } else {
          // C: The Camera has not been torn down and we just want to update some props - update incrementally
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
        }

        Log.i(TAG, "Successfully updated CameraSession Configuration! isActive: ${config.isActive}")
        this.configuration = config

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
    cameraDevice?.close()
    cameraDevice = null

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

  /**
   * Set up the `CameraDevice` (`cameraId`)
   */
  private suspend fun configureCameraDevice(configuration: CameraConfiguration) {
    if (!configuration.isActive) {
      // If isActive=false, we don't care if the device is opened or closed.
      // Android OS can close the CameraDevice if it needs it, otherwise we keep it warm.
      Log.i(TAG, "isActive is false, skipping CameraDevice configuration.")
      return
    }

    if (cameraDevice != null) {
      // Close existing device
      Log.i(TAG, "Closing previous Camera #${cameraDevice?.id}...")
      cameraDevice?.close()
      cameraDevice = null
    }
    isRunning = false

    // Check Camera Permission
    val cameraPermission = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
    if (cameraPermission != PackageManager.PERMISSION_GRANTED) throw CameraPermissionError()

    // Open new device
    val cameraId = configuration.cameraId ?: throw NoCameraDeviceError()
    Log.i(TAG, "Configuring Camera #$cameraId...")
    cameraDevice = cameraManager.openCamera(cameraId, { device, error ->
      if (cameraDevice != device) {
        // a previous device has been disconnected, but we already have a new one.
        // this is just normal behavior
        return@openCamera
      }

      this.cameraDevice = null
      isRunning = false

      if (error != null) {
        Log.e(TAG, "Camera #${device.id} has been unexpectedly disconnected!", error)
        callback.onError(error)
      } else {
        Log.i(TAG, "Camera #${device.id} has been gracefully disconnected!")
      }
    }, CameraQueues.cameraQueue)

    Log.i(TAG, "Successfully configured Camera #$cameraId!")
  }

  /**
   * Set up the `CaptureSession` with all outputs (preview, photo, video, codeScanner) and their HDR/Format settings.
   */
  private suspend fun configureOutputs(configuration: CameraConfiguration) {
    if (!configuration.isActive) {
      Log.i(TAG, "isActive is false, skipping CameraCaptureSession configuration.")
      return
    }
    val cameraDevice = cameraDevice
    if (cameraDevice == null) {
      Log.i(TAG, "CameraSession hasn't configured a CameraDevice, skipping session configuration...")
      return
    }

    // Destroy previous outputs
    Log.i(TAG, "Destroying previous outputs...")
    photoOutput?.close()
    photoOutput = null
    videoOutput?.close()
    videoOutput = null
    codeScannerOutput?.close()
    codeScannerOutput = null
    isRunning = false

    val characteristics = cameraManager.getCameraCharacteristics(cameraDevice.id)
    val format = configuration.format

    Log.i(TAG, "Creating outputs for Camera #${cameraDevice.id}...")

    val isSelfie = characteristics.get(CameraCharacteristics.LENS_FACING) == CameraCharacteristics.LENS_FACING_FRONT

    val outputs = mutableListOf<SurfaceOutput>()

    // Photo Output
    val photo = configuration.photo as? CameraConfiguration.Output.Enabled<CameraConfiguration.Photo>
    if (photo != null) {
      val imageFormat = ImageFormat.JPEG
      val sizes = characteristics.getPhotoSizes(imageFormat)
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
      val sizes = characteristics.getVideoSizes(cameraDevice.id, imageFormat)
      val size = sizes.closestToOrMax(format?.videoSize)

      Log.i(TAG, "Adding ${size.width}x${size.height} Video Output in ${ImageFormatUtils.imageFormatToString(imageFormat)}...")
      val videoPipeline = VideoPipeline(
        size.width,
        size.height,
        video.config.pixelFormat,
        isSelfie,
        video.config.enableFrameProcessor,
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
      val size = characteristics.getPreviewTargetSize(videoSize)

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
      previewView?.size = Size(size.height, size.width)
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
      val sizes = characteristics.getVideoSizes(cameraDevice.id, imageFormat)
      val size = sizes.closestToOrMax(Size(1280, 720))

      Log.i(TAG, "Adding ${size.width}x${size.height} CodeScanner Output in ${ImageFormatUtils.imageFormatToString(imageFormat)}...")
      val pipeline = CodeScannerPipeline(size, imageFormat, codeScanner.config, callback)
      val output = BarcodeScannerOutput(pipeline)
      outputs.add(output)
      codeScannerOutput = output
    }

    // Create session
    captureSession = cameraDevice.createCaptureSession(cameraManager, outputs, { session ->
      if (this.captureSession != session) {
        // a previous session has been closed, but we already have a new one.
        // this is just normal behavior
        return@createCaptureSession
      }

      // onClosed
      this.captureSession = null
      isRunning = false

      Log.i(TAG, "Camera Session $session has been closed.")
    }, CameraQueues.cameraQueue)

    Log.i(TAG, "Successfully configured Session with ${outputs.size} outputs for Camera #${cameraDevice.id}!")

    // Update Frame Processor and RecordingSession for newly changed output
    updateVideoOutputs()
  }

  private fun createRepeatingRequest(device: CameraDevice, targets: List<Surface>, config: CameraConfiguration): CaptureRequest {
    val deviceDetails = cameraDeviceDetails ?: CameraDeviceDetails(cameraManager, device.id)

    val template = if (config.video.isEnabled) CameraDevice.TEMPLATE_RECORD else CameraDevice.TEMPLATE_PREVIEW
    val captureRequest = device.createCaptureRequest(template)

    targets.forEach { t -> captureRequest.addTarget(t) }

    val format = config.format

    // Set FPS
    val fps = config.fps
    if (fps != null) {
      if (format == null) throw PropRequiresFormatToBeNonNullError("fps")
      if (format.maxFps < fps) throw InvalidFpsError(fps)
      captureRequest.set(CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE, Range(fps, fps))
    }

    // Set Video Stabilization
    if (config.videoStabilizationMode != VideoStabilizationMode.OFF) {
      if (format == null) throw PropRequiresFormatToBeNonNullError("videoStabilizationMode")
      if (!format.videoStabilizationModes.contains(
          config.videoStabilizationMode
        )
      ) {
        throw InvalidVideoStabilizationMode(config.videoStabilizationMode)
      }
    }
    when (config.videoStabilizationMode) {
      VideoStabilizationMode.OFF -> {
        // do nothing
      }
      VideoStabilizationMode.STANDARD -> {
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
        captureRequest.set(CaptureRequest.LENS_OPTICAL_STABILIZATION_MODE, CaptureRequest.LENS_OPTICAL_STABILIZATION_MODE_ON)
      }
    }

    // Set HDR
    val video = config.video as? CameraConfiguration.Output.Enabled<CameraConfiguration.Video>
    val videoHdr = video?.config?.enableHdr
    if (videoHdr == true) {
      if (format == null) throw PropRequiresFormatToBeNonNullError("videoHdr")
      if (!format.supportsVideoHdr) throw InvalidVideoHdrError()
      captureRequest.set(CaptureRequest.CONTROL_SCENE_MODE, CaptureRequest.CONTROL_SCENE_MODE_HDR)
    } else if (config.enableLowLightBoost) {
      if (!deviceDetails.supportsLowLightBoost) throw LowLightBoostNotSupportedError()
      captureRequest.set(CaptureRequest.CONTROL_SCENE_MODE, CaptureRequest.CONTROL_SCENE_MODE_NIGHT)
    }

    // Set Exposure Bias
    val exposure = config.exposure?.toInt()
    if (exposure != null) {
      val clamped = deviceDetails.exposureRange.clamp(exposure)
      captureRequest.set(CaptureRequest.CONTROL_AE_EXPOSURE_COMPENSATION, clamped)
    }

    // Set Zoom
    // TODO: Cache camera characteristics? Check perf.
    val cameraCharacteristics = cameraManager.getCameraCharacteristics(device.id)
    captureRequest.setZoom(config.zoom, cameraCharacteristics)

    // Set Torch
    if (config.torch == Torch.ON) {
      if (!deviceDetails.hasFlash) throw FlashUnavailableError()
      captureRequest.set(CaptureRequest.FLASH_MODE, CaptureRequest.FLASH_MODE_TORCH)
    }

    // Start repeating request if the Camera is active
    return captureRequest.build()
  }

  private fun configureCaptureRequest(config: CameraConfiguration) {
    val captureSession = captureSession

    if (!config.isActive) {
      isRunning = false
      try {
        captureSession?.stopRepeating()
      } catch (e: IllegalStateException) {
        // ignore - captureSession is already closed.
      }
      return
    }
    if (captureSession == null) {
      Log.i(TAG, "CameraSession hasn't configured the capture session, skipping CaptureRequest...")
      return
    }

    val preview = config.preview as? CameraConfiguration.Output.Enabled<CameraConfiguration.Preview>
    val previewSurface = preview?.config?.surface
    val targets = listOfNotNull(previewSurface, videoOutput?.surface, codeScannerOutput?.surface)
    if (targets.isEmpty()) {
      Log.i(TAG, "CameraSession has no repeating outputs (Preview, Video, CodeScanner), skipping CaptureRequest...")
      return
    }

    val request = createRepeatingRequest(captureSession.device, targets, config)
    captureSession.setRepeatingRequest(request, null, null)
    isRunning = true
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
      photoOutput.enableHdr,
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
      val cameraDevice = cameraDevice ?: throw CameraNotReadyError()

      val fps = configuration?.fps ?: 30

      val recording = RecordingSession(
        context,
        cameraDevice.id,
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

  suspend fun focus(x: Int, y: Int): Unit = throw NotImplementedError("focus() is not yet implemented!")

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

  interface Callback {
    fun onError(error: Throwable)
    fun onFrame(frame: Frame)
    fun onInitialized()
    fun onStarted()
    fun onStopped()
    fun onCodeScanned(codes: List<Barcode>, scannerFrame: CodeScannerFrame)
  }
}
