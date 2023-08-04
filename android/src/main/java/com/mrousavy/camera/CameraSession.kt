package com.mrousavy.camera

import android.graphics.ImageFormat
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.CaptureResult
import android.hardware.camera2.TotalCaptureResult
import android.media.Image
import android.media.ImageReader
import android.os.Build
import android.util.Log
import android.util.Range
import android.util.Size
import android.view.Surface
import com.mrousavy.camera.extensions.FlashMode
import com.mrousavy.camera.extensions.ImageReaderOutput
import com.mrousavy.camera.extensions.OutputType
import com.mrousavy.camera.extensions.QualityPrioritization
import com.mrousavy.camera.extensions.SessionType
import com.mrousavy.camera.extensions.SurfaceOutput
import com.mrousavy.camera.extensions.capture
import com.mrousavy.camera.extensions.closestToOrMax
import com.mrousavy.camera.extensions.createCaptureSession
import com.mrousavy.camera.extensions.createPhotoCaptureRequest
import com.mrousavy.camera.extensions.openCamera
import com.mrousavy.camera.extensions.tryClose
import com.mrousavy.camera.parsers.getVideoStabilizationMode
import com.mrousavy.camera.utils.ExifUtils
import com.mrousavy.camera.utils.PhotoOutputSynchronizer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.io.Closeable
import java.util.concurrent.CancellationException
import kotlin.coroutines.CoroutineContext

// TODO: Use reprocessable YUV capture session for more efficient Skia Frame Processing

/**
 * A Camera Session.
 * Flow:
 *
 * 1. [cameraDevice] gets rebuilt everytime [cameraId] changes
 * 2. [outputs] get rebuilt everytime [photoOutput], [videoOutput], [previewOutput] or [cameraDevice] changes.
 * 3. [captureSession] gets rebuilt everytime [outputs] changes.
 * 4. [startRunning]/[stopRunning] gets called everytime [isActive] or [captureSession] changes.
 *
 * Examples:
 * - Changing [cameraId] causes everything to be rebuilt.
 * - Changing [videoOutput] causes all [outputs] to be rebuilt, which later causes the [captureSession] to be rebuilt.
 */
class CameraSession(private val cameraManager: CameraManager,
                    private val onInitialized: () -> Unit,
                    private val onError: (e: Throwable) -> Unit): CoroutineScope, Closeable, CameraManager.AvailabilityCallback() {
  companion object {
    private const val TAG = "CameraSession"
    private const val PHOTO_OUTPUT_BUFFER_SIZE = 3
    private const val VIDEO_OUTPUT_BUFFER_SIZE = 2
  }
  data class VideoOutput(val enabled: Boolean,
                         val callback: (image: Image) -> Unit,
                         val targetSize: Size? = null)
  data class PhotoOutput(val enabled: Boolean,
                         val targetSize: Size? = null)
  data class PreviewOutput(val enabled: Boolean,
                           val surface: Surface)

  data class CapturedPhoto(val image: Image,
                           val metadata: TotalCaptureResult,
                           val orientation: Int,
                           val format: Int): Closeable {
    override fun close() {
      image.close()
    }
  }

  // setInput(..)
  private var cameraId: String? = null

  // setOutputs(..)
  private var photoOutput: PhotoOutput? = null
  private var videoOutput: VideoOutput? = null
  private var previewOutput: PreviewOutput? = null

  // setIsActive(..)
  private var isActive = false

  // configureFormat(..)
  private var fps: Int? = null
  private var videoStabilizationMode: String? = null
  private var lowLightBoost: Boolean? = null
  private var hdr: Boolean? = null

  private var captureSession: CameraCaptureSession? = null
  private var cameraDevice: CameraDevice? = null
  private var outputs = ArrayList<SurfaceOutput>()
  private val photoOutputSynchronizer = PhotoOutputSynchronizer()
  private val mutex = Mutex()
  private var didOutputsChange = false
  private var isRunning = false

  override val coroutineContext: CoroutineContext = CameraQueues.cameraQueue.coroutineDispatcher

  init {
    cameraManager.registerAvailabilityCallback(this, CameraQueues.cameraQueue.handler)
  }

  override fun close() {
    cameraManager.unregisterAvailabilityCallback(this)
    photoOutputSynchronizer.clear()
    captureSession?.close()
    cameraDevice?.tryClose()
    outputs.clear()
    isRunning = false
  }

  /**
   * Set the Camera to be used as an input device.
   * Calling this with the same ID twice will not re-open the Camera device.
   */
  fun setInputDevice(cameraId: String) {
    Log.i(TAG, "Setting Input Device to Camera $cameraId...")
    this.cameraId = cameraId
    launch {
      startRunning()
    }
  }

  /**
   * Configure the outputs of the Camera.
   */
  fun setOutputs(photoOutput: PhotoOutput? = null,
                 videoOutput: VideoOutput? = null,
                 previewOutput: PreviewOutput? = null) {
    Log.i(TAG, "Setting Outputs...")
    this.photoOutput = photoOutput
    this.videoOutput = videoOutput
    this.previewOutput = previewOutput
    didOutputsChange = true
    launch {
      startRunning()
    }
  }

  /**
   * Configures various format settings such as FPS, Video Stabilization, HDR or Night Mode.
   */
  fun configureFormat(fps: Int? = null,
                      videoStabilizationMode: String? = null,
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
    Log.i(TAG, "Setting isActive: $isActive")
    this.isActive = isActive
    checkActive()
  }

  private fun checkActive() {
    Log.i(TAG, "checkActive() isActive: $isActive | isRunning: $isRunning")
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
                        flashMode: FlashMode,
                        enableRedEyeReduction: Boolean,
                        enableAutoStabilization: Boolean): CapturedPhoto {
    val captureSession = captureSession ?: throw CameraNotReadyError()

    val photoOutput = outputs.find { it.outputType == OutputType.PHOTO } ?: throw PhotoNotEnabledError()
    val captureRequest = captureSession.device.createPhotoCaptureRequest(cameraManager,
                                                                         photoOutput.surface,
                                                                         qualityPrioritization,
                                                                         flashMode,
                                                                         enableRedEyeReduction,
                                                                         enableAutoStabilization)
    Log.i(TAG, "Photo capture 0/2 - starting capture...")
    val result = captureSession.capture(captureRequest)
    val timestamp = result[CaptureResult.SENSOR_TIMESTAMP]!!
    Log.i(TAG, "Photo capture 1/2 complete - received metadata with timestamp $timestamp")
    try {
      val image = photoOutputSynchronizer.await(timestamp)
      // TODO: Correctly get rotationDegrees and isMirrored
      val rotation = ExifUtils.computeExifOrientation(0, false)

      Log.i(TAG, "Photo capture 2/2 complete - received ${image.width} x ${image.height} image.")
      return CapturedPhoto(image, result, rotation, image.format)
    } catch (e: CancellationException) {
      throw CaptureAbortedError(false)
    }
  }

  private fun onPhotoCaptured(image: Image) {
    Log.i(CameraView.TAG, "Photo captured! ${image.width} x ${image.height}")
    photoOutputSynchronizer.set(image.timestamp, image)
  }

  override fun onCameraAvailable(cameraId: String) {
    super.onCameraAvailable(cameraId)
    Log.i(TAG, "Camera became available: $cameraId")
  }

  override fun onCameraUnavailable(cameraId: String) {
    super.onCameraUnavailable(cameraId)
    Log.i(TAG, "Camera became un-available: $cameraId")
  }

  private fun destroy() {
    Log.i(TAG, "Destroying Session...")
    isRunning = false
    cameraDevice?.tryClose()
    cameraDevice = null
    captureSession?.close()
    captureSession = null
    outputs.forEach { output ->
      if (output is ImageReaderOutput) {
        Log.i(TAG, "Closing ImageReader for ${output.outputType} output..")
        output.imageReader.close()
      }
    }
    outputs.clear()
    photoOutputSynchronizer.clear()
    Log.i(TAG, "Session destroyed!")
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

  private fun getOutputs(cameraId: String): ArrayList<SurfaceOutput> {
    val videoOutput = videoOutput
    val photoOutput = photoOutput
    val previewOutput = previewOutput

    val characteristics = cameraManager.getCameraCharacteristics(cameraId)
    val config = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!

    val outputs = arrayListOf<SurfaceOutput>()

    Log.i(TAG, "Preparing Outputs for Camera $cameraId...")

    if (videoOutput != null && videoOutput.enabled) {
      // Video or Frame Processor output: High resolution repeating images
      val pixelFormat = ImageFormat.YUV_420_888
      val videoSize = config.getOutputSizes(pixelFormat).closestToOrMax(videoOutput.targetSize)

      val imageReader = ImageReader.newInstance(videoSize.width,
                                                videoSize.height,
                                                pixelFormat,
                                                VIDEO_OUTPUT_BUFFER_SIZE)
      imageReader.setOnImageAvailableListener({ reader ->
        val image = reader.acquireNextImage()
        if (image == null) {
          Log.w(CameraView.TAG, "Failed to get new Image from ImageReader, dropping a Frame...")
          return@setOnImageAvailableListener
        }

        videoOutput.callback(image)
      }, CameraQueues.videoQueue.handler)

      Log.i(CameraView.TAG, "Adding ${videoSize.width}x${videoSize.height} video output. (Format: $pixelFormat)")
      outputs.add(ImageReaderOutput(imageReader, OutputType.VIDEO))
    }

    if (photoOutput != null && photoOutput.enabled) {
      // Photo output: High quality still images
      val pixelFormat = ImageFormat.JPEG
      val photoSize = config.getOutputSizes(pixelFormat).closestToOrMax(photoOutput.targetSize)

      val imageReader = ImageReader.newInstance(photoSize.width,
                                                photoSize.height,
                                                pixelFormat,
                                                PHOTO_OUTPUT_BUFFER_SIZE)
      imageReader.setOnImageAvailableListener({ reader ->
        val image = reader.acquireLatestImage()
        onPhotoCaptured(image)
      }, CameraQueues.cameraQueue.handler)

      Log.i(CameraView.TAG, "Adding ${photoSize.width}x${photoSize.height} photo output. (Format: $pixelFormat)")
      outputs.add(ImageReaderOutput(imageReader, OutputType.PHOTO))
    }

    if (previewOutput != null && previewOutput.enabled) {
      // Preview output: Low resolution repeating images
      Log.i(CameraView.TAG, "Adding native preview view output.")
      outputs.add(SurfaceOutput(previewOutput.surface, OutputType.PREVIEW))
    }

    Log.i(TAG, "Prepared ${outputs.size} Outputs for Camera $cameraId!")

    return outputs
  }

  private suspend fun getCaptureSession(cameraDevice: CameraDevice, outputs: List<SurfaceOutput>, onClosed: () -> Unit): CameraCaptureSession {
    val currentSession = captureSession
    if (currentSession?.device == cameraDevice && !didOutputsChange) {
      // We already opened a CameraCaptureSession on this device
      return currentSession
    }
    captureSession?.close()
    // TODO: Call abortCaptures() as well?
    captureSession = null

    val session = cameraDevice.createCaptureSession(cameraManager, SessionType.REGULAR, outputs, { session ->
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
    return session
  }

  private fun getPreviewCaptureRequest(captureSession: CameraCaptureSession,
                                       outputs: List<SurfaceOutput>): CaptureRequest {
    val hasVideoOutput = outputs.any { it.outputType == OutputType.VIDEO }
    val template = if (hasVideoOutput) CameraDevice.TEMPLATE_RECORD else CameraDevice.TEMPLATE_PREVIEW
    val captureRequest = captureSession.device.createCaptureRequest(template)
    outputs.forEach { output ->
      if (output.outputType.isRepeating) {
        Log.i(TAG, "Adding output surface ${output.outputType}..")
        captureRequest.addTarget(output.surface)
      }
    }

    fps?.let { fps ->
      captureRequest.set(CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE, Range(fps, fps))
    }
    videoStabilizationMode?.let { videoStabilizationMode ->
      val stabilizationMode = getVideoStabilizationMode(videoStabilizationMode)
      captureRequest.set(CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE, stabilizationMode.digitalMode)
      captureRequest.set(CaptureRequest.LENS_OPTICAL_STABILIZATION_MODE, stabilizationMode.opticalMode)
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

  private suspend fun startRunning() {
    isRunning = false
    val cameraId = cameraId ?: return

    Log.i(TAG, "Starting Camera Session...")

    try {
      mutex.withLock {
        // 1. Create outputs for device (PREVIEW, PHOTO, VIDEO)
        val outputs = getOutputs(cameraId)
        if (outputs.isEmpty()) return

        // 2. Open Camera Device
        val camera = getCameraDevice(cameraId) { reason ->
          isRunning = false
          onError(reason)
        }

        // 3. Create capture session with outputs
        val session = getCaptureSession(camera, outputs) {
          isRunning = false
          onError(CameraDisconnectedError(cameraId, "session-closed"))
        }

        // 4. Create repeating request (configures FPS, HDR, etc.)
        val repeatingRequest = getPreviewCaptureRequest(session, outputs)

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
      Log.w(TAG, "Failed to start Camera Session, this session is already closed.")
    }
  }

  private suspend fun stopRunning() {
    Log.i(TAG, "Stopping Camera Session...")
    try {
      mutex.withLock {
        val captureSession = captureSession ?: return
        captureSession.stopRepeating()
        Log.i(TAG, "Camera Session stopped!")
      }
    } catch (e: IllegalStateException) {
      Log.w(TAG, "Failed to stop Camera Session, this session is already closed.")
    }
  }
}
