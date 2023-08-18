package com.mrousavy.camera

import android.content.Context
import android.graphics.Rect
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.CaptureResult
import android.hardware.camera2.TotalCaptureResult
import android.media.Image
import android.os.Build
import android.util.Log
import android.util.Range
import android.util.Size
import com.mrousavy.camera.extensions.SessionType
import com.mrousavy.camera.extensions.capture
import com.mrousavy.camera.extensions.createCaptureSession
import com.mrousavy.camera.extensions.createPhotoCaptureRequest
import com.mrousavy.camera.extensions.openCamera
import com.mrousavy.camera.extensions.tryClose
import com.mrousavy.camera.extensions.zoomed
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.parsers.CameraDeviceError
import com.mrousavy.camera.parsers.Flash
import com.mrousavy.camera.parsers.Orientation
import com.mrousavy.camera.parsers.QualityPrioritization
import com.mrousavy.camera.parsers.VideoCodec
import com.mrousavy.camera.parsers.VideoFileType
import com.mrousavy.camera.parsers.VideoStabilizationMode
import com.mrousavy.camera.utils.PhotoOutputSynchronizer
import com.mrousavy.camera.utils.RecordingSession
import com.mrousavy.camera.utils.outputs.CameraOutputs
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.io.Closeable
import java.lang.IllegalArgumentException
import java.util.concurrent.CancellationException
import kotlin.coroutines.CoroutineContext
import kotlin.math.min

// TODO: Use reprocessable YUV capture session for more efficient Skia Frame Processing

class CameraSession(private val context: Context,
                    private val cameraManager: CameraManager,
                    private val onInitialized: () -> Unit,
                    private val onError: (e: Throwable) -> Unit): CoroutineScope, Closeable, CameraOutputs.Callback, CameraManager.AvailabilityCallback() {
  companion object {
    private const val TAG = "CameraSession"
  }

  data class CapturedPhoto(val image: Image,
                           val metadata: TotalCaptureResult,
                           val orientation: Orientation,
                           val isMirrored: Boolean,
                           val format: Int): Closeable {
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
  private val photoOutputSynchronizer = PhotoOutputSynchronizer()
  private val mutex = Mutex()
  private var isRunning = false
  private var enableTorch = false
  private var recording: RecordingSession? = null
  private var frameProcessor: FrameProcessor? = null

  override val coroutineContext: CoroutineContext = CameraQueues.cameraQueue.coroutineDispatcher

  init {
    cameraManager.registerAvailabilityCallback(this, CameraQueues.cameraQueue.handler)
  }

  override fun close() {
    cameraManager.unregisterAvailabilityCallback(this)
    photoOutputSynchronizer.clear()
    captureSession?.close()
    cameraDevice?.tryClose()
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

  fun configureSession(cameraId: String,
                       preview: CameraOutputs.PreviewOutput? = null,
                       photo: CameraOutputs.PhotoOutput? = null,
                       video: CameraOutputs.VideoOutput? = null) {
    Log.i(TAG, "Configuring Session for Camera $cameraId...")
    val outputs = CameraOutputs(cameraId,
      cameraManager,
      preview,
      photo,
      video,
      this)
    if (this.cameraId == cameraId && this.outputs == outputs && isActive == isRunning) {
      Log.i(TAG, "Nothing changed in configuration, canceling..")
    }

    this.cameraId = cameraId
    this.outputs = outputs
    launch {
      startRunning()
    }
  }

  fun configureFormat(fps: Int? = null,
                      videoStabilizationMode: VideoStabilizationMode? = null,
                      hdr: Boolean? = null,
                      lowLightBoost: Boolean? = null) {
    Log.i(TAG, "Setting Format (fps: $fps | videoStabilization: $videoStabilizationMode | hdr: $hdr | lowLightBoost: $lowLightBoost)...")
    this.fps = fps
    this.videoStabilizationMode = videoStabilizationMode
    this.hdr = hdr
    this.lowLightBoost = lowLightBoost
    launch {
      startRunning()
    }
  }

  /**
   * Starts or stops the Camera.
   */
  fun setIsActive(isActive: Boolean) {
    Log.i(TAG, "Setting isActive: $isActive (isRunning: $isRunning)")
    this.isActive = isActive
    if (isActive == isRunning) return

    launch {
      if (isActive) {
        startRunning()
      } else {
        stopRunning()
      }
    }
  }

  fun setFrameProcessor(frameProcessor: FrameProcessor?) {
    this.frameProcessor = frameProcessor
  }

  suspend fun takePhoto(qualityPrioritization: QualityPrioritization,
                        flashMode: Flash,
                        enableRedEyeReduction: Boolean,
                        enableAutoStabilization: Boolean,
                        outputOrientation: Orientation): CapturedPhoto {
    val captureSession = captureSession ?: throw CameraNotReadyError()
    val outputs = outputs ?: throw CameraNotReadyError()

    val photoOutput = outputs.photoOutput ?: throw PhotoNotEnabledError()

    val cameraCharacteristics = cameraManager.getCameraCharacteristics(captureSession.device.id)
    val orientation = outputOrientation.toSensorRelativeOrientation(cameraCharacteristics)
    val captureRequest = captureSession.device.createPhotoCaptureRequest(cameraManager,
                                                                         photoOutput.surface,
                                                                         zoom,
                                                                         qualityPrioritization,
                                                                         flashMode,
                                                                         enableRedEyeReduction,
                                                                         enableAutoStabilization,
                                                                         orientation)
    Log.i(TAG, "Photo capture 0/2 - starting capture...")
    val result = captureSession.capture(captureRequest)
    val timestamp = result[CaptureResult.SENSOR_TIMESTAMP]!!
    Log.i(TAG, "Photo capture 1/2 complete - received metadata with timestamp $timestamp")
    try {
      val image = photoOutputSynchronizer.await(timestamp)

      val isMirrored = cameraCharacteristics.get(CameraCharacteristics.LENS_FACING) == CameraCharacteristics.LENS_FACING_FRONT

      Log.i(TAG, "Photo capture 2/2 complete - received ${image.width} x ${image.height} image.")
      return CapturedPhoto(image, result, orientation, isMirrored, image.format)
    } catch (e: CancellationException) {
      throw CaptureAbortedError(false)
    }
  }

  override fun onPhotoCaptured(image: Image) {
    Log.i(CameraView.TAG, "Photo captured! ${image.width} x ${image.height}")
    photoOutputSynchronizer.set(image.timestamp, image)
  }

  override fun onVideoFrameCaptured(image: Image) {
    // TODO: Correctly get orientation and everything
    val frame = Frame(image, System.currentTimeMillis(), Orientation.PORTRAIT, false)
    frame.incrementRefCount()

    // Call (Skia-) Frame Processor
    frameProcessor?.call(frame)

    // Write Image to the Recording
    recording?.appendImage(image)

    frame.decrementRefCount()
  }

  suspend fun startRecording(enableAudio: Boolean,
                             codec: VideoCodec,
                             fileType: VideoFileType,
                             callback: (video: RecordingSession.Video) -> Unit) {
    mutex.withLock {
      if (recording != null) throw RecordingInProgressError()
      val outputs = outputs ?: throw CameraNotReadyError()
      val videoOutput = outputs.videoOutput ?: throw VideoNotEnabledError()

      val recording = RecordingSession(context, enableAudio, videoOutput.size, fps, codec, orientation, fileType, callback)
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
      startRunning()
    }
  }

  fun setZoom(zoom: Float) {
    if (this.zoom != zoom) {
      this.zoom = zoom
      launch {
        startRunning()
      }
    }
  }

  override fun onCameraAvailable(cameraId: String) {
    super.onCameraAvailable(cameraId)
    Log.i(TAG, "Camera became available: $cameraId")
  }

  override fun onCameraUnavailable(cameraId: String) {
    super.onCameraUnavailable(cameraId)
    Log.i(TAG, "Camera became un-available: $cameraId")
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
    cameraDevice?.tryClose()
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

  private suspend fun getCaptureSession(cameraDevice: CameraDevice,
                                        outputs: CameraOutputs,
                                        onClosed: () -> Unit): CameraCaptureSession {
    val currentSession = captureSession
    if (currentSession?.device == cameraDevice && outputs.hashCode() == lastOutputsHashCode) {
      // We already opened a CameraCaptureSession on this device
      return currentSession
    }
    captureSession?.close()
    captureSession = null

    val session = cameraDevice.createCaptureSession(cameraManager, SessionType.REGULAR, outputs, { session ->
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
    return session
  }

  private fun getPreviewCaptureRequest(captureSession: CameraCaptureSession,
                                       outputs: CameraOutputs,
                                       fps: Int? = null,
                                       videoStabilizationMode: VideoStabilizationMode? = null,
                                       lowLightBoost: Boolean? = null,
                                       hdr: Boolean? = null,
                                       torch: Boolean? = null): CaptureRequest {
    val template = if (outputs.videoOutput != null) CameraDevice.TEMPLATE_RECORD else CameraDevice.TEMPLATE_PREVIEW
    val captureRequest = captureSession.device.createCaptureRequest(template)
    outputs.previewOutput?.let { output ->
      Log.i(TAG, "Adding output surface ${output.outputType}..")
      captureRequest.addTarget(output.surface)
    }
    outputs.videoOutput?.let { output ->
      Log.i(TAG, "Adding output surface ${output.outputType}..")
      captureRequest.addTarget(output.surface)
    }

    if (fps != null) {
      // TODO: Samsung advertises 60 FPS but only allows 30 FPS for some reason.
      val isSamsung = Build.MANUFACTURER == "samsung"
      val targetFps = if (isSamsung) 30 else fps

      captureRequest.set(CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE, Range(targetFps, targetFps))
    }
    if (videoStabilizationMode != null) {
      captureRequest.set(CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE, videoStabilizationMode.toDigitalStabilizationMode())
      captureRequest.set(CaptureRequest.LENS_OPTICAL_STABILIZATION_MODE, videoStabilizationMode.toOpticalStabilizationMode())
    }
    if (lowLightBoost == true) {
      captureRequest.set(CaptureRequest.CONTROL_SCENE_MODE, CaptureRequest.CONTROL_SCENE_MODE_NIGHT)
    }
    if (hdr == true) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
        captureRequest.set(CaptureRequest.CONTROL_SCENE_MODE, CaptureRequest.CONTROL_SCENE_MODE_HDR)
      }
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      captureRequest.set(CaptureRequest.CONTROL_ZOOM_RATIO, zoom)
    } else {
      val cameraCharacteristics = cameraManager.getCameraCharacteristics(cameraId!!)
      val size = cameraCharacteristics.get(CameraCharacteristics.SENSOR_INFO_ACTIVE_ARRAY_SIZE)!!
      captureRequest.set(CaptureRequest.SCALER_CROP_REGION, size.zoomed(zoom))
    }

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

    isRunning = false
  }

  private suspend fun startRunning() {
    isRunning = false
    val cameraId = cameraId ?: return
    if (!isActive) return

    Log.i(TAG, "Starting Camera Session...")

    try {
      mutex.withLock {
        val fps = fps
        val videoStabilizationMode = videoStabilizationMode
        val lowLightBoost = lowLightBoost
        val hdr = hdr
        val outputs = outputs

        if (outputs == null || outputs.size == 0) {
          Log.i(TAG, "CameraSession doesn't have any Outputs, canceling..")
          destroy()
          return@withLock
        }

        // 2. Open Camera Device
        val camera = getCameraDevice(cameraId) { reason ->
          isRunning = false
          onError(reason)
        }

        // 3. Create capture session with outputs
        val session = getCaptureSession(camera, outputs) {
          isRunning = false
          onError(CameraDisconnectedError(cameraId, CameraDeviceError.DISCONNECTED))
        }

        // 4. Create repeating request (configures FPS, HDR, etc.)
        val repeatingRequest = getPreviewCaptureRequest(session, outputs, fps, videoStabilizationMode, lowLightBoost, hdr)

        // 5. Start repeating request
        session.setRepeatingRequest(repeatingRequest, null, null)

        Log.i(TAG, "Camera Session started!")
        isRunning = true
        this.captureSession = session
        this.outputs = outputs
        this.cameraDevice = camera

        onInitialized()
      }
    } catch (e: IllegalStateException) {
      Log.e(TAG, "Failed to start Camera Session, this session is already closed.", e)
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
