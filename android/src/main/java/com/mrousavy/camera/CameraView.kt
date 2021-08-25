package com.mrousavy.camera

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.hardware.camera2.*
import android.util.Log
import android.util.Range
import android.view.*
import android.view.View.OnTouchListener
import android.widget.FrameLayout
import androidx.camera.camera2.interop.Camera2Interop
import androidx.camera.core.*
import androidx.camera.core.impl.*
import androidx.camera.extensions.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.*
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.mrousavy.camera.utils.*
import kotlinx.coroutines.*
import kotlinx.coroutines.guava.await
import java.lang.IllegalArgumentException
import java.util.concurrent.ExecutorService
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
// TODO: configureSession() enableHighQualityPhotos
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
// TODO: takePhoto() enableAutoStabilization
// TODO: takePhoto() enableAutoDistortionCorrection
// TODO: takePhoto() return with jsi::Value Image reference for faster capture

@Suppress("KotlinJniMissingFunction") // I use fbjni, Android Studio is not smart enough to realize that.
@SuppressLint("ClickableViewAccessibility", "ViewConstructor")
class CameraView(context: Context, private val frameProcessorThread: ExecutorService) : FrameLayout(context), LifecycleOwner {
  companion object {
    const val TAG = "CameraView"
    const val TAG_PERF = "CameraView.performance"

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
  var colorSpace: String? = null
  var lowLightBoost: Boolean? = null // nullable bool
  // other props
  var isActive = false
  var torch = "off"
  var zoom: Float = 1f // in "factor"
  var enableZoomGesture = false
  var frameProcessorFps = 1.0

  // private properties
  private val reactContext: ReactContext
    get() = context as ReactContext

  @Suppress("JoinDeclarationAndAssignment")
  internal val previewView: PreviewView
  private val cameraExecutor = Executors.newSingleThreadExecutor()
  internal val takePhotoExecutor = Executors.newSingleThreadExecutor()
  internal val recordVideoExecutor = Executors.newSingleThreadExecutor()
  private var coroutineScope = CoroutineScope(Dispatchers.Main)

  internal var camera: Camera? = null
  internal var imageCapture: ImageCapture? = null
  internal var videoCapture: VideoCapture? = null
  private var imageAnalysis: ImageAnalysis? = null
  private var preview: Preview? = null

  private var lastFrameProcessorCall = System.currentTimeMillis()

  private var extensionsManager: ExtensionsManager? = null

  private val scaleGestureListener: ScaleGestureDetector.SimpleOnScaleGestureListener
  private val scaleGestureDetector: ScaleGestureDetector
  private val touchEventListener: OnTouchListener

  private val lifecycleRegistry: LifecycleRegistry
  private var hostLifecycleState: Lifecycle.State

  private val rotation: Int
    get() {
      return context.displayRotation
    }

  private var minZoom: Float = 1f
  private var maxZoom: Float = 1f

  @DoNotStrip
  private var mHybridData: HybridData

  @Suppress("LiftReturnOrAssignment", "RedundantIf")
  internal val fallbackToSnapshot: Boolean
    @SuppressLint("UnsafeOptInUsageError")
    get() {
      if (video != true && !enableFrameProcessor) {
        // Both use-cases are disabled, so `photo` is the only use-case anyways. Don't need to fallback here.
        return false
      }
      cameraId?.let { cameraId ->
        val cameraManger = reactContext.getSystemService(Context.CAMERA_SERVICE) as? CameraManager
        cameraManger?.let {
          val characteristics = cameraManger.getCameraCharacteristics(cameraId)
          val hardwareLevel = characteristics.get(CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL)
          if (hardwareLevel == CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY) {
            // Camera only supports a single use-case at a time
            return true
          } else {
            if (video == true && enableFrameProcessor) {
              // Camera supports max. 2 use-cases, but both are occupied by `frameProcessor` and `video`
              return true
            } else {
              // Camera supports max. 2 use-cases and only one is occupied (either `frameProcessor` or `video`), so we can add `photo`
              return false
            }
          }
        }
      }
      return false
    }

  init {
    mHybridData = initHybrid()

    previewView = PreviewView(context)
    previewView.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    previewView.installHierarchyFitter() // If this is not called correctly, view finder will be black/blank
    addView(previewView)

    scaleGestureListener = object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
      override fun onScale(detector: ScaleGestureDetector): Boolean {
        zoom = max(min((zoom * detector.scaleFactor), maxZoom), minZoom)
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

  @SuppressLint("RestrictedApi")
  override fun onConfigurationChanged(newConfig: Configuration?) {
    super.onConfigurationChanged(newConfig)

    if (preview?.targetRotation != rotation) {
      preview?.targetRotation = rotation
      imageCapture?.targetRotation = rotation
      imageAnalysis?.targetRotation = rotation
      videoCapture?.setTargetRotation(rotation)
    }
  }

  private external fun initHybrid(): HybridData
  private external fun frameProcessorCallback(frame: ImageProxy)

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
    //  I need to use CoroutineScope.launch because of the suspend fun [configureSession]
    coroutineScope.launch {
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
          val zoomClamped = max(min(zoom, maxZoom), minZoom)
          camera!!.cameraControl.setZoomRatio(zoomClamped)
        }
        if (shouldReconfigureTorch) {
          camera!!.cameraControl.enableTorch(torch == "on")
        }
        if (changedProps.contains("enableZoomGesture")) {
          setOnTouchListener(if (enableZoomGesture) touchEventListener else null)
        }
      } catch (e: Throwable) {
        Log.e(TAG, "update() threw: ${e.message}")
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
      if (cameraId == null) {
        throw NoCameraDeviceError()
      }
      if (format != null)
        Log.i(TAG, "Configuring session with Camera ID $cameraId and custom format...")
      else
        Log.i(TAG, "Configuring session with Camera ID $cameraId and default format options...")

      // Used to bind the lifecycle of cameras to the lifecycle owner
      val cameraProvider = ProcessCameraProvider.getInstance(reactContext).await()

      var cameraSelector = CameraSelector.Builder().byID(cameraId!!).build()

      val tryEnableExtension: (suspend (extension: Int) -> Unit) = lambda@ { extension ->
        if (extensionsManager == null) {
          Log.i(TAG, "Initializing ExtensionsManager...")
          extensionsManager = ExtensionsManager.getInstance(context).await()
        }
        if (extensionsManager!!.isExtensionAvailable(cameraProvider, cameraSelector, extension)) {
          Log.i(TAG, "Enabling extension $extension...")
          cameraSelector = extensionsManager!!.getExtensionEnabledCameraSelector(cameraProvider, cameraSelector, extension)
        } else {
          Log.e(TAG, "Extension $extension is not available for the given Camera!")
          throw when (extension) {
            ExtensionMode.HDR -> HdrNotContainedInFormatError()
            ExtensionMode.NIGHT -> LowLightBoostNotContainedInFormatError()
            else -> Error("Invalid extension supplied! Extension $extension is not available.")
          }
        }
      }

      val previewBuilder = Preview.Builder()
        .setTargetRotation(rotation)
      val imageCaptureBuilder = ImageCapture.Builder()
        .setTargetRotation(rotation)
        .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
      val videoCaptureBuilder = VideoCapture.Builder()
        .setTargetRotation(rotation)
      val imageAnalysisBuilder = ImageAnalysis.Builder()
        .setTargetRotation(rotation)
        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
        .setBackgroundExecutor(frameProcessorThread)

      if (format == null) {
        // let CameraX automatically find best resolution for the target aspect ratio
        Log.i(TAG, "No custom format has been set, CameraX will automatically determine best configuration...")
        val aspectRatio = aspectRatio(previewView.height, previewView.width) // flipped because it's in sensor orientation.
        previewBuilder.setTargetAspectRatio(aspectRatio)
        imageCaptureBuilder.setTargetAspectRatio(aspectRatio)
        videoCaptureBuilder.setTargetAspectRatio(aspectRatio)
      } else {
        // User has selected a custom format={}. Use that
        val format = DeviceFormat(format!!)
        Log.i(TAG, "Using custom format - photo: ${format.photoSize}, video: ${format.videoSize} @ $fps FPS")
        previewBuilder.setTargetResolution(format.videoSize)
        imageCaptureBuilder.setTargetResolution(format.photoSize)
        videoCaptureBuilder.setTargetResolution(format.videoSize)

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
        if (hdr == true) {
          tryEnableExtension(ExtensionMode.HDR)
        }
        if (lowLightBoost == true) {
          tryEnableExtension(ExtensionMode.NIGHT)
        }
      }

      // Unbind use cases before rebinding
      videoCapture = null
      imageCapture = null
      imageAnalysis = null
      cameraProvider.unbindAll()

      // Bind use cases to camera
      val useCases = ArrayList<UseCase>()
      if (video == true) {
        Log.i(TAG, "Adding VideoCapture use-case...")
        videoCapture = videoCaptureBuilder.build()
        useCases.add(videoCapture!!)
      }
      if (photo == true) {
        if (fallbackToSnapshot) {
          Log.i(TAG, "Tried to add photo use-case (`photo={true}`) but the Camera device only supports " +
            "a single use-case at a time. Falling back to Snapshot capture.")
        } else {
          Log.i(TAG, "Adding ImageCapture use-case...")
          imageCapture = imageCaptureBuilder.build()
          useCases.add(imageCapture!!)
        }
      }
      if (enableFrameProcessor) {
        Log.i(TAG, "Adding ImageAnalysis use-case...")
        imageAnalysis = imageAnalysisBuilder.build().apply {
          setAnalyzer(cameraExecutor, { image ->
            val now = System.currentTimeMillis()
            val intervalMs = (1.0 / frameProcessorFps) * 1000.0
            if (now - lastFrameProcessorCall > intervalMs) {
              lastFrameProcessorCall = now
              frameProcessorCallback(image)
            }
            image.close()
          })
        }
        useCases.add(imageAnalysis!!)
      }

      preview = previewBuilder.build()
      Log.i(TAG, "Attaching ${useCases.size} use-cases...")
      camera = cameraProvider.bindToLifecycle(this, cameraSelector, preview, *useCases.toTypedArray())
      preview!!.setSurfaceProvider(previewView.surfaceProvider)

      minZoom = camera!!.cameraInfo.zoomState.value?.minZoomRatio ?: 1f
      maxZoom = camera!!.cameraInfo.zoomState.value?.maxZoomRatio ?: 1f

      val duration = System.currentTimeMillis() - startTime
      Log.i(TAG_PERF, "Session configured in $duration ms! Camera: ${camera!!}")
      invokeOnInitialized()
    } catch (exc: Throwable) {
      Log.e(TAG, "Failed to configure session: ${exc.message}")
      throw when (exc) {
        is CameraError -> exc
        is IllegalArgumentException -> {
          if (exc.message?.contains("too many use cases") == true) {
            ParallelVideoProcessingNotSupportedError(exc)
          } else {
            InvalidCameraDeviceError(exc)
          }
        }
        else -> UnknownCameraError(exc)
      }
    }
  }

  private fun invokeOnInitialized() {
    Log.i(TAG, "invokeOnInitialized()")

    val reactContext = context as ReactContext
    reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "cameraInitialized", null)
  }

  private fun invokeOnError(error: Throwable) {
    Log.e(TAG, "invokeOnError(...):")
    error.printStackTrace()

    val cameraError = when (error) {
      is CameraError -> error
      else -> UnknownCameraError(error)
    }
    val event = Arguments.createMap()
    event.putString("code", cameraError.code)
    event.putString("message", cameraError.message)
    cameraError.cause?.let { cause ->
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
}
