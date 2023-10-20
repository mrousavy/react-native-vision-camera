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
import android.hardware.camera2.params.DynamicRangeProfiles
import android.hardware.camera2.params.MeteringRectangle
import android.hardware.camera2.params.OutputConfiguration
import android.media.Image
import android.media.ImageReader
import android.os.Build
import android.util.Log
import android.util.Range
import android.util.Size
import com.mrousavy.camera.CameraView
import com.mrousavy.camera.core.outputs.CameraOutputs
import com.mrousavy.camera.core.outputs.ImageReaderOutput
import com.mrousavy.camera.extensions.capture
import com.mrousavy.camera.extensions.closestToOrMax
import com.mrousavy.camera.extensions.createCaptureSession
import com.mrousavy.camera.extensions.createPhotoCaptureRequest
import com.mrousavy.camera.extensions.getPhotoSizes
import com.mrousavy.camera.extensions.getVideoSizes
import com.mrousavy.camera.extensions.openCamera
import com.mrousavy.camera.extensions.setZoom
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.types.Flash
import com.mrousavy.camera.types.LensFacing
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.QualityPrioritization
import com.mrousavy.camera.types.Torch
import com.mrousavy.camera.types.VideoCodec
import com.mrousavy.camera.types.VideoFileType
import com.mrousavy.camera.types.VideoStabilizationMode
import java.io.Closeable
import java.util.concurrent.CancellationException
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class CameraSession(
  private val context: Context,
  private val cameraManager: CameraManager,
  private val onInitialized: () -> Unit,
  private val onError: (e: Throwable) -> Unit
): Closeable, CameraOutputs.Callback {
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
  private val photoOutputSynchronizer = PhotoOutputSynchronizer()
  private val mutex = Mutex()
  private var isRunning = false

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
    photoOutputSynchronizer.clear()
    captureSession?.close()
    cameraDevice?.close()
    isRunning = false
  }

  val orientation: Orientation
    get() {
      val cameraId = configuration?.cameraId ?: return Orientation.PORTRAIT
      val characteristics = cameraManager.getCameraCharacteristics(cameraId)
      val sensorRotation = characteristics.get(CameraCharacteristics.SENSOR_ORIENTATION) ?: 0
      return Orientation.fromRotationDegrees(sensorRotation)
    }

  suspend fun configure(callback: (configuration: CameraConfiguration) -> Unit) {
    Log.i(TAG, "Updating CameraSession Configuration...")

    val config = CameraConfiguration.copyOf(this.configuration)
    callback(config)
    val diff = CameraConfiguration.difference(this.configuration, config)

    mutex.withLock {
      try {
        if (diff.deviceChanged) {
          configureCameraDevice(config)
        }
        if (diff.outputsChanged) {
          configureOutputs(config)
        }
        if (diff.sidePropsChanged) {
          configureCaptureRequest(config)
        }

        Log.i(TAG, "Successfully updated CameraSession Configuration!")
      } catch (error: Throwable) {
        Log.e(TAG, "Failed to configure CameraSession! Error: ${error.message}, Config-Diff: $diff", error)
        onError(error)
      }
    }
  }

  /**
   * Set up the `CameraDevice` (`cameraId`)
   */
  private suspend fun configureCameraDevice(configuration: CameraConfiguration) {
    val cameraId = configuration.cameraId ?: throw NoCameraDeviceError()

    Log.i(TAG, "Configuring Camera #$cameraId...")

    // TODO: Do we want to skip this is this.cameraDevice is already cameraId?

    cameraDevice?.close()
    cameraDevice = cameraManager.openCamera(cameraId, { device, error ->
      if (this.cameraDevice == device) {
        Log.e(TAG, "Camera Device $device has been disconnected!", error)
        onError(error)
      } else {
        // a previous device has been disconnected, but we already have a new one.
        // this is just normal behavior
      }
    }, CameraQueues.cameraQueue)

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

    val isSelfie = characteristics.get(CameraCharacteristics.LENS_FACING) == CameraCharacteristics.LENS_FACING_FRONT

    val outputs = mutableListOf<OutputConfiguration>()

    // Preview Output
    // TODO: Add Preview Output here as well

    // Photo Output
    val photo = configuration.photo as? CameraConfiguration.Output.Enabled<CameraConfiguration.Photo>
    if (photo != null) {
      val imageFormat = ImageFormat.JPEG
      val sizes = characteristics.getPhotoSizes(imageFormat)
      val size = sizes.closestToOrMax(format?.photoSize)
      val maxImages = 3

      Log.i(TAG, "Adding ${size.width} x ${size.height} Photo Output in Format #$imageFormat...")
      val imageReader = ImageReader.newInstance(size.width, size.height, imageFormat, maxImages)
      val output = OutputConfiguration(imageReader.surface)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        output.streamUseCase = CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_STILL_CAPTURE.toLong()
      }
      if (configuration.enableHdr) {
        // TODO: Choose best HDR profile.
        // output.dynamicRangeProfile = DynamicRangeProfiles.HLG10
      }
      outputs.add(output)
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
      val output = OutputConfiguration(videoPipeline.surface)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        output.streamUseCase = CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_VIDEO_RECORD.toLong()
      }
      if (configuration.enableHdr) {
        // TODO: Choose best HDR profile.
        // output.dynamicRangeProfile = DynamicRangeProfiles.HLG10
      }
      outputs.add(output)
    }

    // CodeScanner Output
    val codeScanner = configuration.codeScanner as? CameraConfiguration.Output.Enabled<CameraConfiguration.CodeScanner>
    if (codeScanner != null) {
      val imageFormat = ImageFormat.YUV_420_888
      val sizes = characteristics.getVideoSizes(cameraDevice.id, imageFormat)
      val size = sizes.closestToOrMax(Size(1280, 720))

      Log.i(TAG, "Adding ${size.width} x ${size.height} CodeScanner Output in Format #$imageFormat...")
      // TODO: Add correct output thingy with callbacks here
      val o: CameraOutputs.CodeScannerOutput = null!!
      val pipeline = CodeScannerPipeline(size, imageFormat, o)
      val output = OutputConfiguration(pipeline.surface)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        output.streamUseCase = CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_PREVIEW.toLong()
      }
      outputs.add(output)
    }

    // Create new session
    captureSession?.close()
    captureSession = cameraDevice.createCaptureSession(cameraManager, outputs, { session ->
      if (this.captureSession == session) {
        Log.i(TAG, "Camera Session $session has been closed!")
        isRunning = false
      }
    }, CameraQueues.cameraQueue)

    Log.i(TAG, "Successfully configured Session for Camera #${cameraDevice.id}!")
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

    val cameraCharacteristics = cameraManager.getCameraCharacteristics(device.id)

    val template = if (config.video.isEnabled) CameraDevice.TEMPLATE_RECORD else CameraDevice.TEMPLATE_PREVIEW
    val captureRequest = device.createCaptureRequest(template)

    // Set FPS
    // TODO: Check if the FPS range is actually supported in the current configuration.
    val fps = config.fps
    if (fps != null) {
      captureRequest.set(CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE, Range(fps, fps))
    }

    // Set Video Stabilization
    when (config.videoStabilizationMode) {
      VideoStabilizationMode.OFF -> {
        // do nothing
      }
      VideoStabilizationMode.STANDARD -> {
        // TODO: Check if that stabilization mode is even supported
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE_PREVIEW_STABILIZATION else CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE_ON
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
    val outputs = outputs ?: throw CameraNotReadyError()

    val photoOutput = outputs.photoOutput ?: throw PhotoNotEnabledError()

    Log.i(TAG, "Photo capture 0/3 - preparing capture request (${photoOutput.size.width}x${photoOutput.size.height})...")

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

  override fun onPhotoCaptured(image: Image) {
    Log.i(CameraView.TAG, "Photo captured! ${image.width} x ${image.height}")
    photoOutputSynchronizer.set(image.timestamp, image)
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
      val outputs = outputs ?: throw CameraNotReadyError()
      val videoOutput = outputs.videoOutput ?: throw VideoNotEnabledError()

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

  suspend fun setTorchMode(enableTorch: Boolean) {
    if (this.enableTorch != enableTorch) {
      this.enableTorch = enableTorch
      updateRepeatingRequest()
    }
  }

  suspend fun setZoom(zoom: Float) {
    if (this.zoom != zoom) {
      this.zoom = zoom
      updateRepeatingRequest()
    }
  }

  suspend fun focus(x: Int, y: Int) {
    val captureSession = captureSession ?: throw CameraNotReadyError()
    val previewOutput = outputs?.previewOutput ?: throw CameraNotReadyError()
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

  /**
   * Opens a [CameraDevice]. If there already is an open Camera for the given [cameraId], use that.
   */
  private suspend fun getCameraDevice(cameraId: String, onClosed: (error: Throwable) -> Unit): CameraDevice {
    val currentDevice = cameraDevice
    if (currentDevice?.id == cameraId) {
      // We already opened that device
      return currentDevice
    }
    // Close previous device
    cameraDevice?.close()
    cameraDevice = null

    val device = cameraManager.openCamera(cameraId, { camera, reason ->
      Log.d(TAG, "Camera Closed ($cameraDevice == $camera)")
      if (cameraDevice == camera) {
        // The current CameraDevice has been closed, handle that!
        onClosed(reason)
        cameraDevice = null
      } else {
        // A new CameraDevice has been opened, we don't care about this one anymore.
      }
    }, CameraQueues.cameraQueue)

    // Cache device in memory
    cameraDevice = device
    return device
  }

  // Caches the result of outputs.hashCode() of the last getCaptureSession call
  private var lastOutputsHashCode: Int? = null

  private suspend fun getCaptureSession(cameraDevice: CameraDevice, outputs: CameraOutputs, onClosed: () -> Unit): CameraCaptureSession {
    val currentSession = captureSession
    if (currentSession?.device == cameraDevice && outputs.hashCode() == lastOutputsHashCode) {
      // We already opened a CameraCaptureSession on this device
      return currentSession
    }
    captureSession?.close()
    captureSession = null

    val session = cameraDevice.createCaptureSession(cameraManager, outputs, { session ->
      Log.d(TAG, "Capture Session Closed ($captureSession == $session)")
      if (captureSession == session) {
        // The current CameraCaptureSession has been closed, handle that!
        onClosed()
        captureSession = null
      } else {
        // A new CameraCaptureSession has been opened, we don't care about this one anymore.
      }
    }, CameraQueues.cameraQueue)

    // Cache session in memory
    captureSession = session
    lastOutputsHashCode = outputs.hashCode()
    // New session initialized
    onInitialized()
    return session
  }

  private fun getPreviewCaptureRequest(
    fps: Int? = null,
    videoStabilizationMode: VideoStabilizationMode? = null,
    lowLightBoost: Boolean? = null,
    hdr: Boolean? = null,
    torch: Boolean? = null
  ): CaptureRequest {
    val captureRequest = previewRequest ?: throw CameraNotReadyError()

    // FPS
    val fpsRange = if (fps != null && CAN_SET_FPS) Range(fps, fps) else Range(30, 30)
    captureRequest.set(CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE, fpsRange)

    // Video Stabilization
    captureRequest.set(CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE, videoStabilizationMode?.toDigitalStabilizationMode())
    captureRequest.set(CaptureRequest.LENS_OPTICAL_STABILIZATION_MODE, videoStabilizationMode?.toOpticalStabilizationMode())

    // Night/HDR Mode
    val sceneMode = if (hdr ==
      true
    ) {
      CaptureRequest.CONTROL_SCENE_MODE_HDR
    } else if (lowLightBoost == true) CaptureRequest.CONTROL_SCENE_MODE_NIGHT else null
    captureRequest.set(CaptureRequest.CONTROL_SCENE_MODE, sceneMode)
    captureRequest.set(
      CaptureRequest.CONTROL_MODE,
      if (sceneMode != null) CaptureRequest.CONTROL_MODE_USE_SCENE_MODE else CaptureRequest.CONTROL_MODE_AUTO
    )

    // Zoom
    val cameraCharacteristics = cameraManager.getCameraCharacteristics(cameraId!!)
    captureRequest.setZoom(zoom, cameraCharacteristics)

    // Torch Mode
    val torchMode = if (torch == true) CaptureRequest.FLASH_MODE_TORCH else CaptureRequest.FLASH_MODE_OFF
    captureRequest.set(CaptureRequest.FLASH_MODE, torchMode)

    return captureRequest.build()
  }

  private fun destroy() {
    Log.i(TAG, "Destroying session..")
    captureSession?.stopRepeating()
    captureSession?.close()
    captureSession = null

    cameraDevice?.close()
    cameraDevice = null

    outputs?.close()
    outputs = null

    isRunning = false
  }

  private suspend fun startRunning() {
    isRunning = false
    val cameraId = cameraId ?: return
    if (!isActive) return

    Log.i(TAG, "Starting Camera Session...")

    try {
      mutex.withLock {
        val outputs = outputs
        if (outputs == null || outputs.size == 0) {
          Log.i(TAG, "CameraSession doesn't have any Outputs, canceling..")
          destroy()
          return@withLock
        }

        // 1. Open Camera Device
        val camera = getCameraDevice(cameraId) { reason ->
          isRunning = false
          onError(reason)
        }

        // 2. Create capture session with outputs
        val session = getCaptureSession(camera, outputs) {
          isRunning = false
        }

        // 3. Create request template
        val template = if (outputs.videoOutput != null) CameraDevice.TEMPLATE_RECORD else CameraDevice.TEMPLATE_PREVIEW
        val captureRequest = camera.createCaptureRequest(template)
        outputs.previewOutput?.let { output ->
          Log.i(TAG, "Adding preview output surface ${output.outputType}..")
          captureRequest.addTarget(output.surface)
        }
        outputs.videoOutput?.let { output ->
          Log.i(TAG, "Adding video output surface ${output.outputType}..")
          captureRequest.addTarget(output.surface)
        }
        outputs.codeScannerOutput?.let { output ->
          Log.i(TAG, "Adding code scanner output surface ${output.outputType}")
          captureRequest.addTarget(output.surface)
        }

        Log.i(TAG, "Camera Session initialized! Starting repeating request..")
        isRunning = true
        this.previewRequest = captureRequest
        this.captureSession = session
        this.cameraDevice = camera
      }

      updateRepeatingRequest()
    } catch (e: IllegalStateException) {
      Log.e(TAG, "Failed to start Camera Session, this session is already closed.", e)
    }
  }

  private suspend fun updateRepeatingRequest() {
    mutex.withLock {
      val session = captureSession
      if (session == null) {
        // Not yet ready. Start session first, then it will update repeating request.
        startRunning()
        return
      }

      val fps = fps
      val videoStabilizationMode = videoStabilizationMode
      val lowLightBoost = lowLightBoost
      val hdr = hdr
      val enableTorch = enableTorch

      val repeatingRequest = getPreviewCaptureRequest(fps, videoStabilizationMode, lowLightBoost, hdr, enableTorch)
      Log.d(TAG, "Setting Repeating Request..")
      session.setRepeatingRequest(repeatingRequest, null, null)
    }
  }

  private suspend fun stopRunning() {
    Log.i(TAG, "Stopping Camera Session...")
    try {
      mutex.withLock {
        destroy()
        Log.i(TAG, "Camera Session stopped!")
      }
    } catch (e: IllegalStateException) {
      Log.e(TAG, "Failed to stop Camera Session, this session is already closed.", e)
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
}
