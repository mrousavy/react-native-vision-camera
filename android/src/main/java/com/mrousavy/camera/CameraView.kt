package com.mrousavy.camera

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.graphics.ImageFormat
import android.graphics.PixelFormat
import android.hardware.camera2.*
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.params.StreamConfigurationMap
import android.media.ImageReader
import android.os.Build
import android.util.Log
import android.util.Size
import android.view.*
import android.widget.FrameLayout
import androidx.core.content.ContextCompat
import androidx.lifecycle.*
import com.facebook.react.bridge.*
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.utils.OutputType
import com.mrousavy.camera.utils.SessionType
import com.mrousavy.camera.utils.SurfaceOutput
import com.mrousavy.camera.utils.createCaptureSession
import com.mrousavy.camera.parsers.parseCameraError
import com.mrousavy.camera.parsers.parseHardwareLevel
import com.mrousavy.camera.utils.*
import kotlinx.coroutines.*
import kotlin.math.max
import kotlin.math.min

//
// TODOs for the CameraView which are currently too hard to implement either because of CameraX' limitations, or my brain capacity.
//
// CameraView
// TODO: Actually use correct sizes for video and photo (currently it's both the video size)
// TODO: Configurable FPS higher than 30
// TODO: High-speed video recordings (export in CameraViewModule::getAvailableVideoDevices(), and set in CameraView::configurePreview()) (120FPS+)
// TODO: configureSession() enableDepthData
// TODO: configureSession() enableHighQualityPhotos
// TODO: configureSession() enablePortraitEffectsMatteDelivery

// CameraView+RecordVideo
// TODO: Better startRecording()/stopRecording() (promise + callback, wait for TurboModules/JSI)
// TODO: videoStabilizationMode
// TODO: Return Video size/duration

// CameraView+TakePhoto
// TODO: Mirror selfie images
// TODO: takePhoto() depth data
// TODO: takePhoto() raw capture
// TODO: takePhoto() photoCodec ("hevc" | "jpeg" | "raw")
// TODO: takePhoto() qualityPrioritization
// TODO: takePhoto() enableAutoRedEyeReduction
// TODO: takePhoto() enableAutoStabilization
// TODO: takePhoto() enableAutoDistortionCorrection
// TODO: takePhoto() return with jsi::Value Image reference for faster capture

@Suppress("KotlinJniMissingFunction") // I use fbjni, Android Studio is not smart enough to realize that.
@SuppressLint("ClickableViewAccessibility", "ViewConstructor", "MissingPermission")
class CameraView(context: Context) : FrameLayout(context) {
  companion object {
    const val TAG = "CameraView"

    private val propsThatRequireSessionReconfiguration = arrayListOf("cameraId", "format", "fps", "hdr", "lowLightBoost", "photo", "video", "enableFrameProcessor")
    private val arrayListOfZoom = arrayListOf("zoom")
  }

  // react properties
  // props that require reconfiguring
  var cameraId: String? = null // this is actually not a react prop directly, but the result of setting device={}
  var enableDepthData = false
  var enableHighQualityPhotos: Boolean? = null
  var enablePortraitEffectsMatteDelivery = false
  // use-cases
  var photo: Boolean? = null
  var video: Boolean? = null
  var audio: Boolean? = null
  var enableFrameProcessor = false
  // props that require format reconfiguring
  var format: ReadableMap? = null
  var fps: Int? = null
  var hdr: Boolean? = null // nullable bool
  var lowLightBoost: Boolean? = null // nullable bool
  var previewType: String = "native"
  // other props
  var isActive = false
  var torch = "off"
  var zoom: Float = 1f // in "factor"
  var orientation: String? = null

  // private properties
  private var isMounted = false
  private val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager

  // session
  private var cameraSession: CameraCaptureSession? = null
  private val previewView = SurfaceView(context)
  private var isPreviewSurfaceReady = false

  public var frameProcessor: FrameProcessor? = null

  private val inputRotation: Int
    get() {
      return context.displayRotation
    }
  private val outputRotation: Int
    get() {
      if (orientation != null) {
        // user is overriding output orientation
        return when (orientation!!) {
          "portrait" -> Surface.ROTATION_0
          "landscapeRight" -> Surface.ROTATION_90
          "portraitUpsideDown" -> Surface.ROTATION_180
          "landscapeLeft" -> Surface.ROTATION_270
          else -> throw InvalidTypeScriptUnionError("orientation", orientation!!)
        }
      } else {
        // use same as input rotation
        return inputRotation
      }
    }

  private var minZoom: Float = 1f
  private var maxZoom: Float = 1f

  init {
    this.installHierarchyFitter()
    previewView.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    previewView.holder.addCallback(object : SurfaceHolder.Callback {
      override fun surfaceCreated(holder: SurfaceHolder) {
        Log.i(TAG, "PreviewView Surface created!")
        isPreviewSurfaceReady = true
        if (cameraId != null) configureSession()
      }

      override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
        Log.i(TAG, "PreviewView Surface resized!")
      }

      override fun surfaceDestroyed(holder: SurfaceHolder) {
        Log.i(TAG, "PreviewView Surface destroyed!")
        isPreviewSurfaceReady = false
      }
    })
    addView(previewView)
  }

  override fun onConfigurationChanged(newConfig: Configuration?) {
    super.onConfigurationChanged(newConfig)
    // TODO: updateOrientation()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    // TODO: updateLifecycleState()
    if (!isMounted) {
      isMounted = true
      invokeOnViewReady()
    }
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    // TODO: updateLifecycleState()
  }

  /**
   * Invalidate all React Props and reconfigure the device
   */
  fun update(changedProps: ArrayList<String>) {
    try {
      val shouldReconfigureSession = changedProps.containsAny(propsThatRequireSessionReconfiguration)
      val shouldReconfigureZoom = shouldReconfigureSession || changedProps.contains("zoom")
      val shouldReconfigureTorch = shouldReconfigureSession || changedProps.contains("torch")
      val shouldUpdateOrientation = shouldReconfigureSession ||  changedProps.contains("orientation")

      if (changedProps.contains("isActive")) {
        // TODO: updateLifecycleState()
      }
      if (shouldReconfigureSession) {
        // configureSession()
      }
      if (shouldReconfigureZoom) {
        val zoomClamped = max(min(zoom, maxZoom), minZoom)
        // TODO: camera!!.cameraControl.setZoomRatio(zoomClamped)
      }
      if (shouldReconfigureTorch) {
        // TODO: camera!!.cameraControl.enableTorch(torch == "on")
      }
      if (shouldUpdateOrientation) {
        // TODO: updateOrientation()
      }
    } catch (e: Throwable) {
      Log.e(TAG, "update() threw: ${e.message}")
      invokeOnError(e)
    }
  }

  /**
   * Configures the camera capture session. This should only be called when the camera device changes.
   */
  private fun configureSession() {
    Log.i(TAG, "Configuring session...")
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
      throw CameraPermissionError()
    }
    val cameraId = cameraId ?: throw NoCameraDeviceError()

    Log.i(TAG, "Opening Camera $cameraId...")
    cameraManager.openCamera(cameraId, object: CameraDevice.StateCallback() {
      override fun onOpened(camera: CameraDevice) {
        Log.i(TAG, "Successfully opened Camera Device $cameraId!")
        CameraQueues.cameraQueue.coroutineScope.launch {
          configureCamera(camera)
        }
      }

      override fun onDisconnected(camera: CameraDevice) {
        Log.i(TAG, "Camera Device $cameraId has been disconnected! Waiting for reconnect to continue session..")
        invokeOnError(CameraDisconnectedError(cameraId))
      }

      override fun onError(camera: CameraDevice, error: Int) {
        Log.e(TAG, "Failed to open Camera Device $cameraId! Error: $error (${parseCameraError(error)})")
        invokeOnError(CameraCannotBeOpenedError(cameraId, parseCameraError(error)))
      }
    }, null)
  }

  private suspend fun configureCamera(camera: CameraDevice) {
    if (cameraSession != null) {
      // Close any existing Session
      cameraSession?.close()
    }

    val characteristics = cameraManager.getCameraCharacteristics(camera.id)
    val isMirrored = characteristics.get(CameraCharacteristics.LENS_FACING) == CameraCharacteristics.LENS_FACING_FRONT
    val config = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
    val hardwareLevel = characteristics.get(CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL)!!
    val supports3UseCases = hardwareLevel != CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY
      && hardwareLevel != CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LIMITED
    // If both photo and video/frame-processor is enabled but the Camera device only supports one of those use-cases,
    // we need to fall back to Snapshot capture instead of actual photo capture since we cannot attach both photo and video.
    val useSnapshotForPhotoCapture = !supports3UseCases && (photo == true && (video == true || enableFrameProcessor))

    // TODO: minZoom = camera!!.cameraInfo.zoomState.value?.minZoomRatio ?: 1f
    // TODO: maxZoom = camera!!.cameraInfo.zoomState.value?.maxZoomRatio ?: 1f

    val outputs = arrayListOf<SurfaceOutput>()

    if (photo == true) {
      if (useSnapshotForPhotoCapture) {
        Log.i(TAG, "The Camera Device ${camera.id} is running at hardware-level ${parseHardwareLevel(hardwareLevel)}. " +
          "It does not support running both a photo and a video pipeline at the same time, so instead of adding a photo pipeline " +
          "VisionCamera will just take snapshots of the video pipeline when calling takePhoto().")
      } else {
        // Photo output: High quality still images
        val pixelFormat = ImageFormat.JPEG
        val format = this.format
        val targetSize = if (format != null) Size(format.getInt("photoWidth"), format.getInt("photoHeight")) else null
        val photoSize = config.getOutputSizes(pixelFormat).closestToOrMax(targetSize)
        val imageReader = ImageReader.newInstance(photoSize.width, photoSize.height, pixelFormat, 1)
        imageReader.setOnImageAvailableListener({ reader ->
          val image = reader.acquireNextImage()
          Log.d(TAG, "Photo captured! ${image.width} x ${image.height}")
          image.close()
        }, CameraQueues.cameraQueue.handler)

        Log.i(TAG, "Creating ${photoSize.width}x${photoSize.height} photo output. (Format: $pixelFormat)")
        val photoOutput = SurfaceOutput(imageReader.surface, OutputType.PHOTO, isMirrored)
        outputs.add(photoOutput)
      }
    }

    if (video == true || enableFrameProcessor) {
      // Video or Frame Processor output: High resolution repeating images
      val pixelFormat = getVideoFormat(config)
      val format = this.format
      val targetSize = if (format != null) Size(format.getInt("videoWidth"), format.getInt("videoHeight")) else null
      val videoSize = config.getOutputSizes(pixelFormat).closestToOrMax(targetSize)
      val imageReader = ImageReader.newInstance(videoSize.width, videoSize.height, pixelFormat, 2)
      imageReader.setOnImageAvailableListener({ reader ->
        val image = reader.acquireNextImage()
        if (image == null) {
          Log.w(TAG, "Failed to get new Image from ImageReader, dropping a Frame...")
          return@setOnImageAvailableListener
        }
        val frame = Frame(image, System.currentTimeMillis(), inputRotation, isMirrored)
        onFrame(frame)
      }, CameraQueues.videoQueue.handler)

      Log.i(TAG, "Creating ${videoSize.width}x${videoSize.height} video output. (Format: $pixelFormat)")
      val videoOutput = SurfaceOutput(imageReader.surface, OutputType.VIDEO, isMirrored)
      outputs.add(videoOutput)
    }

    if (previewType == "native") {
      // Preview output: Low resolution repeating images
      val previewOutput = SurfaceOutput(previewView.holder.surface, OutputType.PREVIEW, isMirrored)
      outputs.add(previewOutput)
    }

    cameraSession = camera.createCaptureSession(cameraManager, SessionType.REGULAR, outputs, CameraQueues.cameraQueue)

    // Start all repeating requests (Video, Frame Processor, Preview)
    val captureRequest = camera.createCaptureRequest(CameraDevice.TEMPLATE_MANUAL)
    outputs.forEach { output ->
      if (output.isRepeating) captureRequest.addTarget(output.surface)
    }
    cameraSession!!.setRepeatingRequest(captureRequest.build(), null, null)

    Log.i(TAG, "Successfully configured Camera Session!")
    invokeOnInitialized()
  }

  private fun getVideoFormat(config: StreamConfigurationMap): Int {
    val formats = config.outputFormats
    Log.i(TAG, "Device supports ${formats.size} output formats: ${formats.joinToString(", ")}")
    if (formats.contains(ImageFormat.YUV_420_888)) {
      return ImageFormat.YUV_420_888
    }
    if (formats.contains(PixelFormat.RGB_888)) {
      return PixelFormat.RGB_888;
    }
    Log.w(TAG, "Couldn't find YUV_420_888 or RGB_888 format for Video " +
      "Recording, using unknown format instead.. (${formats[0]})")
    return formats[0]
  }
}
