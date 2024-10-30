package com.mrousavy.camera.react

import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
import android.view.Gravity
import android.view.ScaleGestureDetector
import android.widget.FrameLayout
import androidx.camera.view.PreviewView
import com.google.mlkit.vision.barcode.common.Barcode
import com.mrousavy.camera.core.CameraConfiguration
import com.mrousavy.camera.core.CameraSession
import com.mrousavy.camera.core.CodeScannerFrame
import com.mrousavy.camera.core.types.CameraDeviceFormat
import com.mrousavy.camera.core.types.CodeScannerOptions
import com.mrousavy.camera.core.types.Orientation
import com.mrousavy.camera.core.types.OutputOrientation
import com.mrousavy.camera.core.types.PixelFormat
import com.mrousavy.camera.core.types.PreviewViewType
import com.mrousavy.camera.core.types.QualityBalance
import com.mrousavy.camera.core.types.ResizeMode
import com.mrousavy.camera.core.types.ShutterType
import com.mrousavy.camera.core.types.Torch
import com.mrousavy.camera.core.types.VideoStabilizationMode
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessor
import com.mrousavy.camera.react.extensions.installHierarchyFitter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

//
// TODOs for the CameraView which are currently too hard to implement either because of CameraX' limitations, or my brain capacity.
//
// TODO: High-speed video recordings (export in CameraViewModule::getAvailableVideoDevices(), and set in CameraView::configurePreview()) (120FPS+)
// TODO: Better startRecording()/stopRecording() (promise + callback, wait for TurboModules/JSI)
// TODO: takePhoto() depth data
// TODO: takePhoto() raw capture
// TODO: takePhoto() return with jsi::Value Image reference for faster capture
// TODO: Support videoCodec on Android

@SuppressLint("ClickableViewAccessibility", "ViewConstructor", "MissingPermission")
class CameraView(context: Context) :
  FrameLayout(context),
  CameraSession.Callback,
  FpsSampleCollector.Callback {
  companion object {
    const val TAG = "CameraView"
  }

  // react properties
  // props that require reconfiguring
  var cameraId: String? = null
  var enableDepthData = false
  var enablePortraitEffectsMatteDelivery = false
  var isMirrored = false

  // use-cases
  var photo = false
  var video = false
  var audio = false
  var enableFrameProcessor = false
  var pixelFormat: PixelFormat = PixelFormat.YUV
  var enableLocation = false
  var preview = true
    set(value) {
      field = value
      updatePreview()
    }

  // props that require format reconfiguring
  var format: CameraDeviceFormat? = null
  var minFps: Int? = null
  var maxFps: Int? = null
  var videoStabilizationMode: VideoStabilizationMode? = null
  var videoHdr = false
  var photoHdr = false
  var videoBitRateOverride: Double? = null
  var videoBitRateMultiplier: Double? = null

  // TODO: Use .BALANCED once CameraX fixes it https://issuetracker.google.com/issues/337214687
  var photoQualityBalance = QualityBalance.SPEED
  var lowLightBoost = false

  // other props
  var isActive = false
  var torch: Torch = Torch.OFF
  var zoom: Float = 1f // in "factor"
  var exposure: Double = 0.0
  var outputOrientation: OutputOrientation = OutputOrientation.DEVICE
  var androidPreviewViewType: PreviewViewType = PreviewViewType.SURFACE_VIEW
    set(value) {
      field = value
      updatePreview()
    }
  var enableZoomGesture = false
    set(value) {
      field = value
      updateZoomGesture()
    }
  var resizeMode: ResizeMode = ResizeMode.COVER
    set(value) {
      field = value
      updatePreview()
    }

  // code scanner
  var codeScannerOptions: CodeScannerOptions? = null

  // private properties
  private var isMounted = false
  private val mainCoroutineScope = CoroutineScope(Dispatchers.Main)

  // session
  internal val cameraSession: CameraSession
  internal var frameProcessor: FrameProcessor? = null
  internal var previewView: PreviewView? = null
  private var currentConfigureCall: Long = System.currentTimeMillis()
  private val fpsSampleCollector = FpsSampleCollector(this)

  init {
    clipToOutline = true
    cameraSession = CameraSession(context, this)
    this.installHierarchyFitter()
    updatePreview()
  }

  override fun onAttachedToWindow() {
    Log.i(TAG, "CameraView attached to window!")
    super.onAttachedToWindow()
    if (!isMounted) {
      // Notifies JS view that the native view is now available
      isMounted = true
      invokeOnViewReady()
    }
    // start collecting FPS samples
    fpsSampleCollector.start()
  }

  override fun onDetachedFromWindow() {
    Log.i(TAG, "CameraView detached from window!")
    super.onDetachedFromWindow()
    // stop collecting FPS samples
    fpsSampleCollector.stop()
  }

  fun destroy() {
    cameraSession.close()
  }

  fun update() {
    Log.i(TAG, "Updating CameraSession...")
    val now = System.currentTimeMillis()
    currentConfigureCall = now

    mainCoroutineScope.launch {
      cameraSession.configure { config ->
        if (currentConfigureCall != now) {
          // configure waits for a lock, and if a new call to update() happens in the meantime we can drop this one.
          // this works similar to how React implemented concurrent rendering, the newer call to update() has higher priority.
          Log.i(TAG, "A new configure { ... } call arrived, aborting this one...")
          throw CameraConfiguration.AbortThrow()
        }

        // Input Camera Device
        config.cameraId = cameraId

        // Preview
        val previewView = previewView
        if (previewView != null) {
          config.preview = CameraConfiguration.Output.Enabled.create(CameraConfiguration.Preview(previewView.surfaceProvider))
        } else {
          config.preview = CameraConfiguration.Output.Disabled.create()
        }

        // Photo
        if (photo) {
          config.photo = CameraConfiguration.Output.Enabled.create(CameraConfiguration.Photo(isMirrored, photoHdr, photoQualityBalance))
        } else {
          config.photo = CameraConfiguration.Output.Disabled.create()
        }

        // Video
        if (video || enableFrameProcessor) {
          config.video =
            CameraConfiguration.Output.Enabled.create(
              CameraConfiguration.Video(isMirrored, videoHdr, videoBitRateOverride, videoBitRateMultiplier)
            )
        } else {
          config.video = CameraConfiguration.Output.Disabled.create()
        }

        // Frame Processor
        if (enableFrameProcessor) {
          config.frameProcessor = CameraConfiguration.Output.Enabled.create(CameraConfiguration.FrameProcessor(isMirrored, pixelFormat))
        } else {
          config.frameProcessor = CameraConfiguration.Output.Disabled.create()
        }

        // Audio
        if (audio) {
          config.audio = CameraConfiguration.Output.Enabled.create(CameraConfiguration.Audio(Unit))
        } else {
          config.audio = CameraConfiguration.Output.Disabled.create()
        }

        // Location
        config.enableLocation = enableLocation && this@CameraView.isActive

        // Code Scanner
        val codeScanner = codeScannerOptions
        if (codeScanner != null) {
          config.codeScanner = CameraConfiguration.Output.Enabled.create(
            CameraConfiguration.CodeScanner(codeScanner.codeTypes)
          )
        } else {
          config.codeScanner = CameraConfiguration.Output.Disabled.create()
        }

        // Orientation
        config.outputOrientation = outputOrientation

        // Format
        config.format = format

        // Side-Props
        config.minFps = minFps
        config.maxFps = maxFps
        config.enableLowLightBoost = lowLightBoost
        config.torch = torch
        config.exposure = exposure

        // Zoom
        config.zoom = zoom

        // isActive
        config.isActive = this@CameraView.isActive
      }
    }
  }

  @SuppressLint("ClickableViewAccessibility")
  private fun updateZoomGesture() {
    if (enableZoomGesture) {
      val scaleGestureDetector = ScaleGestureDetector(
        context,
        object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
          override fun onScale(detector: ScaleGestureDetector): Boolean {
            zoom *= detector.scaleFactor
            update()
            return true
          }
        }
      )
      setOnTouchListener { _, event ->
        scaleGestureDetector.onTouchEvent(event)
      }
    } else {
      setOnTouchListener(null)
    }
  }

  private fun updatePreview() {
    mainCoroutineScope.launch {
      if (preview && previewView == null) {
        // User enabled Preview, add the PreviewView
        previewView = createPreviewView()
        addView(previewView)
      } else if (!preview && previewView != null) {
        // User disabled Preview, remove the PreviewView
        removeView(previewView)
        previewView = null
      }
      previewView?.let {
        // Update implementation type from React
        it.implementationMode = androidPreviewViewType.toPreviewImplementationMode()
        // Update scale type from React
        it.scaleType = resizeMode.toScaleType()
      }
      update()
    }
  }

  private fun createPreviewView(): PreviewView =
    PreviewView(context).also {
      it.installHierarchyFitter()
      it.implementationMode = androidPreviewViewType.toPreviewImplementationMode()
      it.layoutParams = LayoutParams(
        LayoutParams.MATCH_PARENT,
        LayoutParams.MATCH_PARENT,
        Gravity.CENTER
      )
      var lastIsPreviewing = false
      it.previewStreamState.observe(cameraSession) { state ->
        Log.i(TAG, "PreviewView Stream State changed to $state")

        val isPreviewing = state == PreviewView.StreamState.STREAMING
        if (isPreviewing != lastIsPreviewing) {
          // Notify callback
          if (isPreviewing) {
            invokeOnPreviewStarted()
          } else {
            invokeOnPreviewStopped()
          }
          lastIsPreviewing = isPreviewing
        }
      }
    }

  override fun onFrame(frame: Frame) {
    // Update average FPS samples
    fpsSampleCollector.onTick()

    // Call JS Frame Processor
    frameProcessor?.call(frame)
  }

  override fun onError(error: Throwable) {
    invokeOnError(error)
  }

  override fun onInitialized() {
    invokeOnInitialized()
  }

  override fun onStarted() {
    invokeOnStarted()
  }

  override fun onStopped() {
    invokeOnStopped()
  }

  override fun onShutter(type: ShutterType) {
    invokeOnShutter(type)
  }

  override fun onOutputOrientationChanged(outputOrientation: Orientation) {
    invokeOnOutputOrientationChanged(outputOrientation)
  }

  override fun onPreviewOrientationChanged(previewOrientation: Orientation) {
    invokeOnPreviewOrientationChanged(previewOrientation)
  }

  override fun onCodeScanned(codes: List<Barcode>, scannerFrame: CodeScannerFrame) {
    invokeOnCodeScanned(codes, scannerFrame)
  }

  override fun onAverageFpsChanged(averageFps: Double) {
    invokeOnAverageFpsChanged(averageFps)
  }
}
