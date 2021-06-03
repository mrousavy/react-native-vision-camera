package com.mrousavy.camera

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.camera2.*
import android.util.Log
import android.util.Range
import android.view.*
import android.view.View.OnTouchListener
import android.widget.FrameLayout
import androidx.camera.camera2.interop.Camera2Interop
import androidx.camera.core.*
import androidx.camera.core.impl.*
import androidx.camera.extensions.HdrImageCaptureExtender
import androidx.camera.extensions.HdrPreviewExtender
import androidx.camera.extensions.NightImageCaptureExtender
import androidx.camera.extensions.NightPreviewExtender
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.*
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.mrousavy.camera.utils.*
import kotlinx.coroutines.*
import kotlinx.coroutines.guava.await
import java.lang.IllegalArgumentException
import java.util.concurrent.Executors
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
// TODO: configureSession() enableHighResolutionCapture
// TODO: configureSession() enablePortraitEffectsMatteDelivery
// TODO: configureSession() colorSpace

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
// TODO: takePhoto() enableVirtualDeviceFusion
// TODO: takePhoto() enableAutoStabilization
// TODO: takePhoto() enableAutoDistortionCorrection
// TODO: takePhoto() return with jsi::Value Image reference for faster capture

@SuppressLint("ClickableViewAccessibility") // suppresses the warning that the pinch to zoom gesture is not accessible
class CameraView(context: Context) : FrameLayout(context), LifecycleOwner {
  // react properties
  // props that require reconfiguring
  var cameraId: String? = null // this is actually not a react prop directly, but the result of setting device={}
  var enableDepthData = false
  var enableHighResolutionCapture: Boolean? = null
  var enablePortraitEffectsMatteDelivery = false
  // props that require format reconfiguring
  var format: ReadableMap? = null
  var fps: Int? = null
  var hdr: Boolean? = null // nullable bool
  var colorSpace: String? = null
  var lowLightBoost: Boolean? = null // nullable bool
  // other props
  var isActive = false
  var torch = "off"
  var zoom = 0.0 // in percent
  var enableZoomGesture = false

  // private properties
  private val reactContext: ReactContext
    get() = context as ReactContext

  @Suppress("JoinDeclarationAndAssignment")
  internal val previewView: PreviewView
  private val cameraExecutor = Executors.newSingleThreadExecutor()
  internal val takePhotoExecutor = Executors.newSingleThreadExecutor()
  internal val recordVideoExecutor = Executors.newSingleThreadExecutor()

  internal var camera: Camera? = null
  internal var imageCapture: ImageCapture? = null
  internal var videoCapture: VideoCapture? = null

  private val scaleGestureListener: ScaleGestureDetector.SimpleOnScaleGestureListener
  private val scaleGestureDetector: ScaleGestureDetector
  private val touchEventListener: OnTouchListener

  private val lifecycleRegistry: LifecycleRegistry
  private var hostLifecycleState: Lifecycle.State

  private var minZoom: Float = 1f
  private var maxZoom: Float = 1f

  init {
    previewView = PreviewView(context)
    previewView.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    previewView.installHierarchyFitter() // If this is not called correctly, view finder will be black/blank
    addView(previewView)

    scaleGestureListener = object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
      override fun onScale(detector: ScaleGestureDetector): Boolean {
        zoom = min(max(((zoom + 1) * detector.scaleFactor) - 1, 0.0), 1.0)
        update(arrayListOfZoom)
        return true
      }
    }
    scaleGestureDetector = ScaleGestureDetector(context, scaleGestureListener)
    touchEventListener = OnTouchListener { _, event -> return@OnTouchListener scaleGestureDetector.onTouchEvent(event) }

    hostLifecycleState = Lifecycle.State.INITIALIZED
    lifecycleRegistry = LifecycleRegistry(this)
    reactContext.addLifecycleEventListener(object : LifecycleEventListener {
      override fun onHostResume() {
        hostLifecycleState = Lifecycle.State.RESUMED
        updateLifecycleState()
      }
      override fun onHostPause() {
        hostLifecycleState = Lifecycle.State.CREATED
        updateLifecycleState()
      }
      override fun onHostDestroy() {
        hostLifecycleState = Lifecycle.State.DESTROYED
        updateLifecycleState()
        cameraExecutor.shutdown()
        takePhotoExecutor.shutdown()
        recordVideoExecutor.shutdown()
      }
    })
  }

  override fun getLifecycle(): Lifecycle {
    return lifecycleRegistry
  }

  /**
   * Updates the custom Lifecycle to match the host activity's lifecycle, and if it's active we narrow it down to the [isActive] and [isAttachedToWindow] fields.
   */
  private fun updateLifecycleState() {
    val lifecycleBefore = lifecycleRegistry.currentState
    if (hostLifecycleState == Lifecycle.State.RESUMED) {
      // Host Lifecycle (Activity) is currently active (RESUMED), so we narrow it down to the view's lifecycle
      if (isActive && isAttachedToWindow) {
        lifecycleRegistry.currentState = Lifecycle.State.RESUMED
      } else {
        lifecycleRegistry.currentState = Lifecycle.State.CREATED
      }
    } else {
      // Host Lifecycle (Activity) is currently inactive (STARTED or DESTROYED), so that overrules our view's lifecycle
      lifecycleRegistry.currentState = hostLifecycleState
    }
    Log.d(TAG, "Lifecycle went from ${lifecycleBefore.name} -> ${lifecycleRegistry.currentState.name} (isActive: $isActive | isAttachedToWindow: $isAttachedToWindow)")
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    updateLifecycleState()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    updateLifecycleState()
  }

  /**
   * Invalidate all React Props and reconfigure the device
   */
  fun update(changedProps: ArrayList<String>) = previewView.post {
    // TODO: Does this introduce too much overhead?
    //  I need to .post on the previewView because it might've not been initialized yet
    //  I need to use GlobalScope.launch because of the suspend fun [configureSession]
    GlobalScope.launch(Dispatchers.Main) {
      try {
        val shouldReconfigureSession = changedProps.containsAny(propsThatRequireSessionReconfiguration)
        val shouldReconfigureZoom = shouldReconfigureSession || changedProps.contains("zoom")
        val shouldReconfigureTorch = shouldReconfigureSession || changedProps.contains("torch")

        if (changedProps.contains("isActive")) {
          updateLifecycleState()
        }
        if (shouldReconfigureSession) {
          configureSession()
        }
        if (shouldReconfigureZoom) {
          val scaled = (zoom.toFloat() * (maxZoom - minZoom)) + minZoom
          camera!!.cameraControl.setZoomRatio(scaled)
        }
        if (shouldReconfigureTorch) {
          camera!!.cameraControl.enableTorch(torch == "on")
        }
        if (changedProps.contains("enableZoomGesture")) {
          setOnTouchListener(if (enableZoomGesture) touchEventListener else null)
        }
      } catch (e: CameraError) {
        invokeOnError(e)
      }
    }
  }

  /**
   * Configures the camera capture session. This should only be called when the camera device changes.
   */
  @SuppressLint("RestrictedApi")
  private suspend fun configureSession() {
    try {
      val startTime = System.currentTimeMillis()
      Log.i(TAG, "Configuring session...")
      if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
        throw CameraPermissionError()
      }
      if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
        throw MicrophonePermissionError()
      }
      if (cameraId == null) {
        throw NoCameraDeviceError()
      }
      if (format != null)
        Log.i(TAG, "Configuring session with Camera ID $cameraId and custom format...")
      else
        Log.i(TAG, "Configuring session with Camera ID $cameraId and default format options...")

      // Used to bind the lifecycle of cameras to the lifecycle owner
      val cameraProvider = ProcessCameraProvider.getInstance(reactContext).await()

      val cameraSelector = CameraSelector.Builder().byID(cameraId!!).build()

      val rotation = previewView.display.rotation

      val previewBuilder = Preview.Builder()
        .setTargetRotation(rotation)
      val imageCaptureBuilder = ImageCapture.Builder()
        .setTargetRotation(rotation)
        .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
      val videoCaptureBuilder = VideoCapture.Builder()
        .setTargetRotation(rotation)

      if (format == null) {
        // let CameraX automatically find best resolution for the target aspect ratio
        Log.i(TAG, "No custom format has been set, CameraX will automatically determine best configuration...")
        val aspectRatio = aspectRatio(previewView.width, previewView.height)
        previewBuilder.setTargetAspectRatio(aspectRatio)
        imageCaptureBuilder.setTargetAspectRatio(aspectRatio)
        videoCaptureBuilder.setTargetAspectRatio(aspectRatio)
      } else {
        // User has selected a custom format={}. Use that
        val format = DeviceFormat(format!!)
        Log.i(TAG, "Using custom format - photo: ${format.photoSize}, video: ${format.videoSize} @ $fps FPS")
        previewBuilder.setDefaultResolution(format.photoSize)
        imageCaptureBuilder.setDefaultResolution(format.photoSize)
        videoCaptureBuilder.setDefaultResolution(format.photoSize)

        fps?.let { fps ->
          if (format.frameRateRanges.any { it.contains(fps) }) {
            // Camera supports the given FPS (frame rate range)
            val frameDuration = (1.0 / fps.toDouble()).toLong() * 1_000_000_000

            Log.i(TAG, "Setting AE_TARGET_FPS_RANGE to $fps-$fps, and SENSOR_FRAME_DURATION to $frameDuration")
            Camera2Interop.Extender(previewBuilder)
              .setCaptureRequestOption(CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE, Range(fps, fps))
              .setCaptureRequestOption(CaptureRequest.SENSOR_FRAME_DURATION, frameDuration)
            videoCaptureBuilder.setVideoFrameRate(fps)
          } else {
            throw FpsNotContainedInFormatError(fps)
          }
        }
        hdr?.let { hdr ->
          // Enable HDR scene mode if set
          if (hdr) {
            val imageExtension = HdrImageCaptureExtender.create(imageCaptureBuilder)
            val previewExtension = HdrPreviewExtender.create(previewBuilder)
            val isExtensionAvailable = imageExtension.isExtensionAvailable(cameraSelector) &&
              previewExtension.isExtensionAvailable(cameraSelector)
            if (isExtensionAvailable) {
              Log.i(TAG, "Enabling native HDR extension...")
              imageExtension.enableExtension(cameraSelector)
              previewExtension.enableExtension(cameraSelector)
            } else {
              Log.e(TAG, "Native HDR vendor extension not available!")
              throw HdrNotContainedInFormatError()
            }
          }
        }
        lowLightBoost?.let { lowLightBoost ->
          if (lowLightBoost) {
            val imageExtension = NightImageCaptureExtender.create(imageCaptureBuilder)
            val previewExtension = NightPreviewExtender.create(previewBuilder)
            val isExtensionAvailable = imageExtension.isExtensionAvailable(cameraSelector) &&
              previewExtension.isExtensionAvailable(cameraSelector)
            if (isExtensionAvailable) {
              Log.i(TAG, "Enabling native night-mode extension...")
              imageExtension.enableExtension(cameraSelector)
              previewExtension.enableExtension(cameraSelector)
            } else {
              Log.e(TAG, "Native night-mode vendor extension not available!")
              throw LowLightBoostNotContainedInFormatError()
            }
          }
        }
      }

      val preview = previewBuilder.build()
      imageCapture = imageCaptureBuilder.build()
      videoCapture = videoCaptureBuilder.build()

      // Unbind use cases before rebinding
      cameraProvider.unbindAll()

      // Bind use cases to camera
      camera = cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageCapture!!, videoCapture!!)
      preview.setSurfaceProvider(previewView.surfaceProvider)

      minZoom = camera!!.cameraInfo.zoomState.value?.minZoomRatio ?: 1f
      maxZoom = camera!!.cameraInfo.zoomState.value?.maxZoomRatio ?: 1f

      val duration = System.currentTimeMillis() - startTime
      Log.i(TAG_PERF, "Session configured in $duration ms! Camera: ${camera!!}")
      invokeOnInitialized()
    } catch (exc: Throwable) {
      throw when (exc) {
        is CameraError -> exc
        is IllegalArgumentException -> InvalidCameraDeviceError(exc)
        else -> UnknownCameraError(exc)
      }
    }
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    Log.i(TAG, "onLayout($changed, $left, $top, $right, $bottom) was called! (Width: $width, Height: $height)")
  }

  private fun invokeOnInitialized() {
    val reactContext = context as ReactContext
    reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "cameraInitialized", null)
  }

  private fun invokeOnError(error: CameraError) {
    val event = Arguments.createMap()
    event.putString("code", error.code)
    event.putString("message", error.message)
    error.cause?.let { cause ->
      event.putMap("cause", errorToMap(cause))
    }
    val reactContext = context as ReactContext
    reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "cameraError", event)
  }

  private fun errorToMap(error: Throwable): WritableMap {
    val map = Arguments.createMap()
    map.putString("message", error.message)
    map.putString("stacktrace", error.stackTraceToString())
    error.cause?.let { cause ->
      map.putMap("cause", errorToMap(cause))
    }
    return map
  }

  companion object {
    const val TAG = "CameraView"
    const val TAG_PERF = "CameraView.performance"

    private val propsThatRequireSessionReconfiguration = arrayListOf("cameraId", "format", "fps", "hdr", "lowLightBoost")

    private val arrayListOfZoom = arrayListOf("zoom")
  }
}
