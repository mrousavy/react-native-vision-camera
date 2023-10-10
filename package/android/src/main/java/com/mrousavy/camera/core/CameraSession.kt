package com.mrousavy.camera.core

import android.content.Context
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
import android.os.Build
import android.util.Log
import android.util.Range
import android.util.Size
import com.mrousavy.camera.CameraNotReadyError
import com.mrousavy.camera.CameraQueues
import com.mrousavy.camera.CameraView
import com.mrousavy.camera.CaptureAbortedError
import com.mrousavy.camera.NoRecordingInProgressError
import com.mrousavy.camera.PhotoNotEnabledError
import com.mrousavy.camera.RecorderError
import com.mrousavy.camera.RecordingInProgressError
import com.mrousavy.camera.VideoNotEnabledError
import com.mrousavy.camera.core.outputs.CameraOutputs
import com.mrousavy.camera.extensions.capture
import com.mrousavy.camera.extensions.createCaptureSession
import com.mrousavy.camera.extensions.createPhotoCaptureRequest
import com.mrousavy.camera.extensions.openCamera
import com.mrousavy.camera.extensions.setZoom
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.parsers.Flash
import com.mrousavy.camera.parsers.Orientation
import com.mrousavy.camera.parsers.QualityPrioritization
import com.mrousavy.camera.parsers.VideoCodec
import com.mrousavy.camera.parsers.VideoFileType
import com.mrousavy.camera.parsers.VideoStabilizationMode
import java.io.Closeable
import java.util.concurrent.CancellationException
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class CameraSession(
  private val context: Context,
  private val cameraManager: CameraManager,
  private val onInitialized: () -> Unit,
  private val onError: (e: Throwable) -> Unit
) : CameraManager.AvailabilityCallback(),
  Closeable,
  CameraOutputs.Callback {
  companion object {
    private const val TAG = "CameraSession"

    // TODO: Samsung advertises 60 FPS but only allows 30 FPS for some reason.
    private val CAN_SET_FPS = !Build.MANUFACTURER.equals("samsung", true)
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

  // setInput(..)
  private var cameraId: String? = null

  // setOutputs(..)
  private var outputs: CameraOutputs? = null

  // setIsActive(..)
  private var isActive = false

  // configureFormat(..)
  private var fps: Int? = null
  private var videoStabilizationMode: VideoStabilizationMode? = null
  private var lowLightBoost: Boolean? = null
  private var hdr: Boolean? = null

  // zoom(..)
  private var zoom: Float = 1.0f

  private var captureSession: CameraCaptureSession? = null
  private var cameraDevice: CameraDevice? = null
  private var previewRequest: CaptureRequest.Builder? = null
  private val photoOutputSynchronizer = PhotoOutputSynchronizer()
  private val mutex = Mutex()
  private var isRunning = false
  private var enableTorch = false

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

  init {
    cameraManager.registerAvailabilityCallback(this, CameraQueues.cameraQueue.handler)
  }

  override fun close() {
    cameraManager.unregisterAvailabilityCallback(this)
    photoOutputSynchronizer.clear()
    captureSession?.close()
    cameraDevice?.close()
    outputs?.close()
    isRunning = false
  }

  val orientation: Orientation
    get() {
      val cameraId = cameraId ?: return Orientation.PORTRAIT
      val characteristics = cameraManager.getCameraCharacteristics(cameraId)
      val sensorRotation = characteristics.get(CameraCharacteristics.SENSOR_ORIENTATION) ?: 0
      return Orientation.fromRotationDegrees(sensorRotation)
    }

  suspend fun configureSession(
    cameraId: String,
    preview: CameraOutputs.PreviewOutput? = null,
    photo: CameraOutputs.PhotoOutput? = null,
    video: CameraOutputs.VideoOutput? = null,
    codeScanner: CameraOutputs.CodeScannerOutput? = null
  ) {
    Log.i(TAG, "Configuring Session for Camera $cameraId...")
    val outputs = CameraOutputs(
      cameraId,
      cameraManager,
      preview,
      photo,
      video,
      codeScanner,
      hdr == true,
      this
    )
    if (this.cameraId == cameraId && this.outputs == outputs && isActive == isRunning) {
      Log.i(TAG, "Nothing changed in configuration, canceling..")
    }

    // 1. Close previous outputs
    this.outputs?.close()
    // 2. Assign new outputs
    this.outputs = outputs
    // 3. Update with existing render targets (surfaces)
    updateVideoOutputs()

    this.cameraId = cameraId
    startRunning()
  }

  suspend fun configureFormat(
    fps: Int? = null,
    videoStabilizationMode: VideoStabilizationMode? = null,
    hdr: Boolean? = null,
    lowLightBoost: Boolean? = null
  ) {
    Log.i(TAG, "Setting Format (fps: $fps | videoStabilization: $videoStabilizationMode | hdr: $hdr | lowLightBoost: $lowLightBoost)...")
    this.fps = fps
    this.videoStabilizationMode = videoStabilizationMode
    this.hdr = hdr
    this.lowLightBoost = lowLightBoost

    var needsReconfiguration = false
    val currentOutputs = outputs
    if (currentOutputs != null && currentOutputs.enableHdr != hdr) {
      // Update existing HDR for Outputs
      this.outputs = CameraOutputs(
        currentOutputs.cameraId,
        cameraManager,
        currentOutputs.preview,
        currentOutputs.photo,
        currentOutputs.video,
        currentOutputs.codeScanner,
        hdr,
        this
      )
      needsReconfiguration = true
    }
    if (needsReconfiguration) {
      startRunning()
    } else {
      updateRepeatingRequest()
    }
  }

  /**
   * Starts or stops the Camera.
   */
  suspend fun setIsActive(isActive: Boolean) {
    Log.i(TAG, "Setting isActive: $isActive (isRunning: $isRunning)")
    this.isActive = isActive
    if (isActive == isRunning) return

    if (isActive) {
      startRunning()
    } else {
      stopRunning()
    }
  }

  private fun updateVideoOutputs() {
    val videoPipeline = outputs?.videoOutput?.videoPipeline ?: return
    videoPipeline.setRecordingSessionOutput(this.recording)
    videoPipeline.setFrameProcessorOutput(this.frameProcessor)
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

  override fun onCameraAvailable(cameraId: String) {
    super.onCameraAvailable(cameraId)
    Log.i(TAG, "Camera became available: $cameraId")
  }

  override fun onCameraUnavailable(cameraId: String) {
    super.onCameraUnavailable(cameraId)
    Log.i(TAG, "Camera became un-available: $cameraId")
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
}
