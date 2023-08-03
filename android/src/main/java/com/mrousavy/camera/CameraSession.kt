package com.mrousavy.camera

import android.annotation.SuppressLint
import android.graphics.ImageFormat
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureRequest
import android.media.Image
import android.media.ImageReader
import android.os.Build
import android.util.Log
import android.util.Range
import android.util.Size
import android.view.Surface
import com.mrousavy.camera.parsers.getVideoStabilizationMode
import com.mrousavy.camera.parsers.parseCameraError
import com.mrousavy.camera.utils.OutputType
import com.mrousavy.camera.utils.SessionType
import com.mrousavy.camera.utils.SurfaceOutput
import com.mrousavy.camera.utils.closestToOrMax
import com.mrousavy.camera.utils.createCaptureSession
import kotlinx.coroutines.launch
import java.io.Closeable
import java.lang.IllegalStateException

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
                     private val onError: (e: Throwable) -> Unit): Closeable, CameraManager.AvailabilityCallback() {
  companion object {
    private const val TAG = "CameraSession"
  }
  /**
   * Represents any kind of output for the Camera that delivers Images. Can either be Video or Photo.
   */
  data class Output(val enabled: Boolean,
                    val callback: (image: Image) -> Unit,
                    val targetSize: Size? = null)

  // setInput(..)
  private var cameraId: String? = null

  // setOutputs(..)
  private var photoOutput: Output? = null
  private var videoOutput: Output? = null
  private var previewOutput: Surface? = null

  // setIsActive(..)
  private var isActive = false

  // configureFormat(..)
  private var fps: Int? = null
  private var videoStabilizationMode: String? = null
  private var lowLightBoost: Boolean? = null
  private var hdr: Boolean? = null

  private val outputs = arrayListOf<SurfaceOutput>()
  private var cameraDevice: CameraDevice? = null
  private var captureRequest: CaptureRequest? = null
  private var captureSession: CameraCaptureSession? = null


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
  fun setOutputs(photoOutput: Output? = null,
                 videoOutput: Output? = null,
                 previewOutput: Surface? = null) {
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
    prepareCaptureRequest()
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
    if (captureSession?.device?.id == cameraId) {
      Log.i(TAG, "Tried to open Camera $cameraId, but we already have a Capture Session running with that Camera. Skipping...")
      return
    }

    cameraManager.openCamera(cameraId, object: CameraDevice.StateCallback() {
      // When Camera is successfully opened (called once)
      override fun onOpened(camera: CameraDevice) {
        Log.i(TAG, "Camera $cameraId: opened!")
        onCameraInitialized(camera)
      }

      // When Camera has been disconnected (either called on init, or later)
      override fun onDisconnected(camera: CameraDevice) {
        Log.i(TAG, "Camera $cameraId: disconnected!")

        onCameraDisconnected()
        camera.close()
      }

      // When Camera has been encountered an Error (either called on init, or later)
      override fun onError(camera: CameraDevice, errorCode: Int) {
        val errorString = parseCameraError(errorCode)
        onError(CameraCannotBeOpenedError(cameraId, errorString))
        Log.e(TAG, "Camera $cameraId: error! ($errorCode: $errorString)")

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
  }


  /**
   * Prepares the Image Reader and Surface outputs.
   * Call this whenever [cameraId], [photoOutput], [videoOutput], or [previewOutput] changes.
   */
  private fun prepareOutputs() {
    val cameraId = cameraId ?: return
    val videoOutput = videoOutput
    val photoOutput = photoOutput
    val previewOutput = previewOutput

    Log.i(TAG, "Preparing Outputs for Camera $cameraId...")

    outputs.clear()

    val characteristics = cameraManager.getCameraCharacteristics(cameraId)
    val config = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!

    if (videoOutput != null) {
      // Video or Frame Processor output: High resolution repeating images
      val pixelFormat = ImageFormat.YUV_420_888
      val videoSize = config.getOutputSizes(pixelFormat).closestToOrMax(videoOutput.targetSize)

      val imageReader = ImageReader.newInstance(videoSize.width, videoSize.height, pixelFormat, 2)
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

    if (photoOutput != null) {
      // Photo output: High quality still images
      val pixelFormat = ImageFormat.JPEG
      val photoSize = config.getOutputSizes(pixelFormat).closestToOrMax(photoOutput.targetSize)

      val imageReader = ImageReader.newInstance(photoSize.width, photoSize.height, pixelFormat, 1)
      imageReader.setOnImageAvailableListener({ reader ->
        val image = reader.acquireLatestImage()
        image.use {
          Log.d(CameraView.TAG, "Photo captured! ${image.width} x ${image.height}")
          photoOutput.callback(image)
        }
      }, CameraQueues.cameraQueue.handler)

      Log.i(CameraView.TAG, "Adding ${photoSize.width}x${photoSize.height} photo output. (Format: $pixelFormat)")
      outputs.add(SurfaceOutput(imageReader.surface, OutputType.PHOTO))
    }

    if (previewOutput != null) {
      // Preview output: Low resolution repeating images
      Log.i(CameraView.TAG, "Adding native preview view output.")
      outputs.add(SurfaceOutput(previewOutput, OutputType.PREVIEW))
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
    CameraQueues.cameraQueue.coroutineScope.launch {
      val camera = cameraDevice ?: return@launch
      if (outputs.isEmpty()) return@launch

      Log.i(TAG, "Creating CameraCaptureSession for Camera ${camera.id}...")
      captureSession?.close()

      captureSession = camera.createCaptureSession(
        cameraManager,
        SessionType.REGULAR,
        outputs,
        CameraQueues.cameraQueue
      )
      Log.i(TAG, "Successfully created CameraCaptureSession for Camera ${camera.id}!")

      prepareCaptureRequest()
    }
  }

  /**
   * Prepares the repeating capture request which will be sent to the Camera.
   * Call this whenever [captureSession], [fps], [videoStabilizationMode], [hdr], or [lowLightBoost] changes.
   */
  private fun prepareCaptureRequest() {
    val captureSession = captureSession ?: return
    val fps = fps
    val videoStabilizationMode = videoStabilizationMode
    val hdr = hdr
    val lowLightBoost = lowLightBoost

    Log.i(TAG, "Preparing repeating Capture Request...")

    val captureRequest = captureSession.device.createCaptureRequest(CameraDevice.TEMPLATE_MANUAL)
    outputs.forEach { output ->
      if (output.isRepeating) {
        Log.i(TAG, "Adding output surface ${output.outputType}..")
        captureRequest.addTarget(output.surface)
      }
    }

    if (fps != null) {
      captureRequest.set(CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE, Range(fps, fps))
    }
    if (videoStabilizationMode != null) {
      captureRequest.set(CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE, getVideoStabilizationMode(videoStabilizationMode))
    }
    if (lowLightBoost == true) {
      captureRequest.set(CaptureRequest.CONTROL_SCENE_MODE, CaptureRequest.CONTROL_SCENE_MODE_NIGHT)
    }
    if (hdr == true) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
        captureRequest.set(CaptureRequest.CONTROL_SCENE_MODE, CaptureRequest.CONTROL_SCENE_MODE_HDR)
      }
    }
    this.captureRequest = captureRequest.build()

    // Capture Request changed, restart it
    if (isActive) startRunning()
  }

  private fun startRunning() {
    val captureSession = captureSession ?: return
    val captureRequest = captureRequest ?: return

    Log.i(TAG, "Starting Camera Session...")
    try {
      // Start all repeating requests (Video, Frame Processor, Preview)
      captureSession.setRepeatingRequest(captureRequest, null, null)
    } catch (e: IllegalStateException) {
      Log.w(TAG, "Failed to start Camera Session, this session is already closed.")
    }
  }

  private fun stopRunning() {
    Log.i(TAG, "Stopping Camera Session...")
    try {
      captureSession?.stopRepeating()
    } catch (e: IllegalStateException) {
      Log.w(TAG, "Failed to stop Camera Session, this session is already closed.")
    }
  }
}
