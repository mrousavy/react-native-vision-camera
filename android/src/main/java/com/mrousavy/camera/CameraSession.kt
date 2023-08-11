package com.mrousavy.camera

import android.content.Context
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.CaptureResult
import android.hardware.camera2.TotalCaptureResult
import android.media.AudioPresentation
import android.media.CamcorderProfile
import android.media.Image
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaRecorder
import android.os.Build
import android.util.Log
import android.util.Range
import android.util.Size
import com.mrousavy.camera.extensions.SessionType
import com.mrousavy.camera.extensions.capture
import com.mrousavy.camera.extensions.createCaptureSession
import com.mrousavy.camera.extensions.createPhotoCaptureRequest
import com.mrousavy.camera.extensions.getCamcorderQualityForSize
import com.mrousavy.camera.extensions.openCamera
import com.mrousavy.camera.extensions.setDynamicRangeProfile
import com.mrousavy.camera.extensions.tryClose
import com.mrousavy.camera.parsers.CameraDeviceError
import com.mrousavy.camera.parsers.Flash
import com.mrousavy.camera.parsers.Orientation
import com.mrousavy.camera.parsers.QualityPrioritization
import com.mrousavy.camera.parsers.VideoStabilizationMode
import com.mrousavy.camera.utils.CameraOutputs
import com.mrousavy.camera.utils.PhotoOutputSynchronizer
import com.mrousavy.camera.utils.VideoRecording
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.io.Closeable
import java.util.concurrent.CancellationException
import kotlin.coroutines.CoroutineContext

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

  private var captureSession: CameraCaptureSession? = null
  private var cameraDevice: CameraDevice? = null
  private val photoOutputSynchronizer = PhotoOutputSynchronizer()
  private val mutex = Mutex()
  private var isRunning = false
  private var recording: VideoRecording? = null

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

  suspend fun startRecording(enableAudio: Boolean, path: String) {
    mutex.withLock {
      if (recording != null) throw RecordingInProgressError()
      val outputs = outputs ?: throw CameraNotReadyError()
      val videoInput = outputs.video ?: throw VideoNotEnabledError()
      val videoOutput = outputs.videoOutput ?: throw VideoNotEnabledError()

      val size = Size(videoOutput.imageReader.width, videoOutput.imageReader.height)
      val recording = VideoRecording(size, fps, videoInput.hdrProfile)
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

  private suspend fun getCaptureSession(cameraDevice: CameraDevice,
                                        outputs: CameraOutputs,
                                        onClosed: () -> Unit): CameraCaptureSession {
    val currentSession = captureSession
    // TODO: Compare if outputs changed... Attach outputs to CameraCaptureSession?
    if (currentSession?.device == cameraDevice && this.outputs == outputs) {
      // We already opened a CameraCaptureSession on this device
      return currentSession
    }
    captureSession?.close()
    // TODO: Call abortCaptures() as well?
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
    this.outputs = outputs
    captureSession = session
    return session
  }

  private fun getPreviewCaptureRequest(captureSession: CameraCaptureSession,
                                       outputs: CameraOutputs,
                                       fps: Int? = null,
                                       videoStabilizationMode: VideoStabilizationMode? = null,
                                       lowLightBoost: Boolean? = null,
                                       hdr: Boolean? = null): CaptureRequest {
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
      captureRequest.set(CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE, Range(fps, fps))
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

    Log.i(TAG, "Starting Camera Session...")

    try {
      mutex.withLock {
        val fps = fps
        val videoStabilizationMode = videoStabilizationMode
        val lowLightBoost = lowLightBoost
        val hdr = hdr
        val outputs = outputs

        if (outputs == null) {
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
