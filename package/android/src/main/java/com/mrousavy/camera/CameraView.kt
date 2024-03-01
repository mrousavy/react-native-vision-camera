package com.mrousavy.camera

import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
import android.view.Gravity
import android.view.ScaleGestureDetector
import android.widget.FrameLayout
import androidx.camera.core.Preview.SurfaceProvider
import androidx.camera.view.PreviewView
import com.google.mlkit.vision.barcode.common.Barcode
import com.mrousavy.camera.core.CameraConfiguration
import com.mrousavy.camera.core.CameraSession
import com.mrousavy.camera.core.CodeScannerFrame
import com.mrousavy.camera.extensions.installHierarchyFitter
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.types.CameraDeviceFormat
import com.mrousavy.camera.types.CodeScannerOptions
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.PixelFormat
import com.mrousavy.camera.types.PreviewViewType
import com.mrousavy.camera.types.QualityBalance
import com.mrousavy.camera.types.ResizeMode
import com.mrousavy.camera.types.Torch
import com.mrousavy.camera.types.VideoStabilizationMode
import com.mrousavy.camera.utils.runOnUiThread
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

@SuppressLint("ClickableViewAccessibility", "ViewConstructor", "MissingPermission")
class CameraView(context: Context) :
  FrameLayout(context),
  CameraSession.Callback {
  companion object {
    const val TAG = "CameraView"
  }

  // react properties
  // props that require reconfiguring
  var cameraId: String? = null
  var enableDepthData = false
  var enablePortraitEffectsMatteDelivery = false

  // use-cases
  var photo = false
  var video = false
  var audio = false
  var enableFrameProcessor = false
  var pixelFormat: PixelFormat = PixelFormat.NATIVE

  // props that require format reconfiguring
  var format: CameraDeviceFormat? = null
  var fps: Int? = null
  var videoStabilizationMode: VideoStabilizationMode? = null
  var videoHdr = false
  var photoHdr = false
  var photoQualityBalance = QualityBalance.BALANCED
  var lowLightBoost = false
  var enableGpuBuffers = false

  // other props
  var isActive = false
  var torch: Torch = Torch.OFF
  var zoom: Float = 1f // in "factor"
  var exposure: Double = 1.0
  var orientation: Orientation = Orientation.PORTRAIT
  var androidPreviewViewType: PreviewViewType = PreviewViewType.SURFACE_VIEW
    set(value) {
      field = value
      updatePreviewType()
    }
  var enableZoomGesture = false
    set(value) {
      field = value
      updateZoomGesture()
    }
  var resizeMode: ResizeMode = ResizeMode.COVER
    set(value) {
      previewView.scaleType = value.toScaleType()
      field = value
    }
  var enableFpsGraph = false
    set(value) {
      field = value
      updateFpsGraph()
    }

  // code scanner
  var codeScannerOptions: CodeScannerOptions? = null

  // private properties
  private var isMounted = false
  private val mainCoroutineScope = CoroutineScope(Dispatchers.Main)

  // session
  internal val cameraSession: CameraSession
  internal var frameProcessor: FrameProcessor? = null
  internal val previewView: PreviewView
  private val previewSurfaceProvider: SurfaceProvider
  private var currentConfigureCall: Long = System.currentTimeMillis()

  // other
  private var fpsGraph: FpsGraphView? = null

  init {
    this.installHierarchyFitter()
    clipToOutline = true
    previewView = PreviewView(context).also {
      it.implementationMode = PreviewView.ImplementationMode.PERFORMANCE
      it.layoutParams = LayoutParams(
        LayoutParams.MATCH_PARENT,
        LayoutParams.MATCH_PARENT,
        Gravity.CENTER
      )
      addView(it)
      previewSurfaceProvider = it.surfaceProvider
      it.previewStreamState.observeForever { state ->
        when (state) {
          PreviewView.StreamState.STREAMING -> onStarted()
          PreviewView.StreamState.IDLE -> onStopped()
          else -> Log.i(TAG, "PreviewView Stream State changed to $state")
        }
      }
    }
    cameraSession = CameraSession(context, this)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (!isMounted) {
      isMounted = true
      invokeOnViewReady()
    }
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
          return@configure
        }

        // Input Camera Device
        config.cameraId = cameraId

        // Preview
        config.preview = CameraConfiguration.Output.Enabled.create(CameraConfiguration.Preview(previewSurfaceProvider))

        // Photo
        if (photo) {
          config.photo = CameraConfiguration.Output.Enabled.create(CameraConfiguration.Photo(photoHdr, photoQualityBalance))
        } else {
          config.photo = CameraConfiguration.Output.Disabled.create()
        }

        // Video/Frame Processor
        if (video || enableFrameProcessor) {
          config.video = CameraConfiguration.Output.Enabled.create(
            CameraConfiguration.Video(
              videoHdr,
              pixelFormat,
              enableFrameProcessor,
              enableGpuBuffers
            )
          )
        } else {
          config.video = CameraConfiguration.Output.Disabled.create()
        }

        // Audio
        if (audio) {
          config.audio = CameraConfiguration.Output.Enabled.create(CameraConfiguration.Audio(Unit))
        } else {
          config.audio = CameraConfiguration.Output.Disabled.create()
        }

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
        config.orientation = orientation

        // Format
        config.format = format

        // Side-Props
        config.fps = fps
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

  private fun updateFpsGraph() {
    if (enableFpsGraph) {
      if (fpsGraph != null) return
      fpsGraph = FpsGraphView(context)
      addView(fpsGraph)
    } else {
      if (fpsGraph == null) return
      removeView(fpsGraph)
      fpsGraph = null
    }
  }

  private fun updatePreviewType() {
    runOnUiThread {
      previewView.implementationMode = androidPreviewViewType.toPreviewImplementationMode()
      update()
    }
  }

  override fun onFrame(frame: Frame) {
    frameProcessor?.call(frame)

    fpsGraph?.onTick()
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

  override fun onShutter() {
    invokeOnShutter()
  }

  override fun onCodeScanned(codes: List<Barcode>, scannerFrame: CodeScannerFrame) {
    invokeOnCodeScanned(codes, scannerFrame)
  }
}
