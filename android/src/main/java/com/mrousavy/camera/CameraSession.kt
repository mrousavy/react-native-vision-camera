package com.mrousavy.camera

import android.annotation.SuppressLint
import android.graphics.ImageFormat
import android.hardware.camera2.CameraAccessException
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
import com.mrousavy.camera.extensions.OutputType
import com.mrousavy.camera.extensions.QualityPrioritization
import com.mrousavy.camera.extensions.SessionType
import com.mrousavy.camera.extensions.SurfaceOutput
import com.mrousavy.camera.extensions.capture
import com.mrousavy.camera.extensions.closestToOrMax
import com.mrousavy.camera.extensions.createCaptureSession
import com.mrousavy.camera.extensions.createPhotoCaptureRequest
import com.mrousavy.camera.parsers.getVideoStabilizationMode
import com.mrousavy.camera.parsers.parseCameraError
import com.mrousavy.camera.utils.ExifUtils
import com.mrousavy.camera.utils.PhotoOutputSynchronizer
import java.io.Closeable
import java.util.concurrent.CancellationException

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
                    private val onError: (e: Throwable) -> Unit): Closeable, CameraManager.AvailabilityCallback() {
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

  private val outputs = arrayListOf<SurfaceOutput>()
  private var cameraDevice: CameraDevice? = null
  private var captureSession: CameraCaptureSession? = null
  private var cameraIdCurrentlyOpening: String? = null
  private val photoOutputSynchronizer = PhotoOutputSynchronizer()

  init {
    cameraManager.registerAvailabilityCallback(this, CameraQueues.cameraQueue.handler)
  }

  override fun close() {
    cameraManager.unregisterAvailabilityCallback(this)
    captureSession?.close()
  }

  /**
   * Set the Camera to be used as an input device.
   * Calling this with the same ID twice will not re-open the Camera device.
   */
  fun setInputDevice(cameraId: String) {
    Log.i(TAG, "Setting Input Device to Camera $cameraId...")
    this.cameraId = cameraId

    openCamera(cameraId)
    // cameraId changed, prepare outputs.
    prepareOutputs()
  }

  /**
   * Configure the outputs of the Camera.
   */
  fun setOutputs(photoOutput: PhotoOutput? = null,
                 videoOutput: VideoOutput? = null,
                 previewOutput: PreviewOutput? = null) {
    this.photoOutput = photoOutput
    this.videoOutput = videoOutput
    this.previewOutput = previewOutput
    // outputs changed, prepare them.
    prepareOutputs()
  }

  /**
   * Configures various format settings such as FPS, Video Stabilization, HDR or Night Mode.
   */
  fun configureFormat(fps: Int? = null,
                      videoStabilizationMode: String? = null,
                      hdr: Boolean? = null,
                      lowLightBoost: Boolean? = null) {
    this.fps = fps
    this.videoStabilizationMode = videoStabilizationMode
    this.hdr = hdr
    this.lowLightBoost = lowLightBoost
  }

  /**
   * Starts or stops the Camera.
   */
  fun setIsActive(isActive: Boolean) {
    Log.i(TAG, "setIsActive($isActive)")
    if (this.isActive == isActive) {
      // We're already active/inactive.
      return
    }

    this.isActive = isActive
    if (isActive) startRunning()
    else stopRunning()
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
      val image = photoOutputSynchronizer[timestamp].await()
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
    if (cameraId == this.cameraId) {
      // The Camera we are trying to use just became available, open it!
      openCamera(cameraId)
    }
  }

  override fun onCameraUnavailable(cameraId: String) {
    super.onCameraUnavailable(cameraId)
    Log.i(TAG, "Camera became un-available: $cameraId")
  }

  @SuppressLint("MissingPermission")
  private fun openCamera(cameraId: String) {
    if (cameraIdCurrentlyOpening == cameraId) return
    cameraIdCurrentlyOpening = cameraId

    if (captureSession?.device?.id == cameraId) {
      Log.i(TAG, "Tried to open Camera $cameraId, but we already have a Capture Session running with that Camera. Skipping...")
      return
    }

    Log.i(TAG, "Opening Camera $cameraId...")

    var didOpen = false
    cameraManager.openCamera(cameraId, object: CameraDevice.StateCallback() {
      // When Camera is successfully opened (called once)
      override fun onOpened(camera: CameraDevice) {
        Log.i(TAG, "Camera $cameraId: opened!")
        didOpen = true
        onCameraInitialized(camera)
      }

      // When Camera has been disconnected (either called on init, or later)
      override fun onDisconnected(camera: CameraDevice) {
        Log.i(TAG, "Camera $cameraId: disconnected!")

        if (didOpen) {
          onError(CameraDisconnectedError(camera.id))
        } else {
          onError(CameraCannotBeOpenedError(camera.id, "camera-disconnected"))
        }

        onCameraDisconnected()
        camera.close()
      }

      // When Camera has been encountered an Error (either called on init, or later)
      override fun onError(camera: CameraDevice, errorCode: Int) {
        Log.i(TAG, "onError(${camera.id}) $errorCode")

        if (didOpen) {
          onError(CameraDisconnectedError(camera.id))
        } else {
          onError(CameraCannotBeOpenedError(camera.id, parseCameraError(errorCode)))
        }

        onCameraDisconnected()
        camera.close()
      }
    }, CameraQueues.cameraQueue.handler)
  }

  private fun onCameraInitialized(camera: CameraDevice) {
    cameraDevice = camera
    prepareSession()
  }

  private fun onCameraDisconnected() {
    cameraDevice = null
    captureSession?.close()
    captureSession = null
    photoOutputSynchronizer.clear()
  }


  /**
   * Prepares the Image Reader and Surface outputs.
   * Call this whenever [cameraId], [photoOutput], [videoOutput], or [previewOutput] changes.
   */
  private fun prepareOutputs() {
    outputs.clear()

    val cameraId = cameraId ?: return
    val videoOutput = videoOutput
    val photoOutput = photoOutput
    val previewOutput = previewOutput

    Log.i(TAG, "Preparing Outputs for Camera $cameraId...")

    val characteristics = cameraManager.getCameraCharacteristics(cameraId)
    val config = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!

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
      outputs.add(SurfaceOutput(imageReader.surface, OutputType.VIDEO))
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
      outputs.add(SurfaceOutput(imageReader.surface, OutputType.PHOTO))
    }

    if (previewOutput != null && previewOutput.enabled) {
      // Preview output: Low resolution repeating images
      Log.i(CameraView.TAG, "Adding native preview view output.")
      outputs.add(SurfaceOutput(previewOutput.surface, OutputType.PREVIEW))
    }

    Log.i(TAG, "Prepared ${outputs.size} Outputs for Camera $cameraId!")

    // Outputs changed, re-create session
    if (cameraDevice != null) prepareSession()
  }

  /**
   * Creates the [CameraCaptureSession].
   * Call this whenever [cameraDevice] or [outputs] changes.
   */
  private fun prepareSession() {
    val camera = cameraDevice ?: return
    if (outputs.isEmpty()) return

    Log.i(TAG, "Creating CameraCaptureSession for Camera ${camera.id}...")
    captureSession?.close()
    captureSession = null
    photoOutputSynchronizer.clear()

    try {
      camera.createCaptureSession(
        cameraManager,
        SessionType.REGULAR,
        outputs,
        object : CameraCaptureSession.StateCallback() {
          override fun onConfigured(session: CameraCaptureSession) {
            Log.d(TAG, "$session Successfully configured Capture Session for Camera ${camera.id}")
            captureSession = session
            if (isActive) startRunning()
          }

          override fun onConfigureFailed(session: CameraCaptureSession) {
            Log.d(TAG, "$session Failed to configure Capture Session for Camera ${camera.id}!")
            onError(CameraCannotBeOpenedError(camera.id, "session-configuration-failed"))
          }

          override fun onClosed(session: CameraCaptureSession) {
            super.onClosed(session)
            Log.d(TAG, "$session Capture Session for Camera ${camera.id} closed!")
            try {
              session.close()
            } catch (_: Throwable) {
            }
            captureSession = null
            photoOutputSynchronizer.clear()
          }
        },
        CameraQueues.cameraQueue
      )
    } catch (e: CameraAccessException) {
      Log.e(TAG, "Camera Access Exception!", e)
      onError(CameraCannotBeOpenedError(camera.id, "camera-not-connected-anymore"))
    }
  }

  private fun startRunning() {
    val captureSession = captureSession ?: return

    Log.i(TAG, "Starting Camera Session...")
    try {
      Log.i(TAG, "Preparing repeating Capture Request...")

      val captureRequest = captureSession.device.createCaptureRequest(CameraDevice.TEMPLATE_MANUAL)
      outputs.forEach { output ->
        if (output.isRepeating) {
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

      // Start all repeating requests (Video, Frame Processor, Preview)
      captureSession.setRepeatingRequest(captureRequest.build(), null, null)
      Log.i(TAG, "Camera Session started!")

      onInitialized()
    } catch (e: IllegalStateException) {
      Log.w(TAG, "Failed to start Camera Session, this session is already closed.")
    }
  }

  private fun stopRunning() {
    Log.i(TAG, "Stopping Camera Session...")
    try {
      val captureSession = captureSession ?: return
      captureSession.stopRepeating()
      Log.i(TAG, "Camera Session stopped!")
    } catch (e: IllegalStateException) {
      Log.w(TAG, "Failed to stop Camera Session, this session is already closed.")
    }
  }
}
