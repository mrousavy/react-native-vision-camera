package com.mrousavy.camera

import android.annotation.SuppressLint
import android.content.Context
import android.hardware.camera2.CameraManager
import android.util.Log
import android.util.Size
import android.view.ScaleGestureDetector
import android.view.Surface
import android.view.SurfaceHolder
import android.widget.FrameLayout
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.mrousavy.camera.core.CameraConfiguration
import com.mrousavy.camera.core.CameraQueues
import com.mrousavy.camera.core.CameraSession
import com.mrousavy.camera.core.NoCameraDeviceError
import com.mrousavy.camera.core.PreviewView
import com.mrousavy.camera.extensions.bigger
import com.mrousavy.camera.extensions.getPreviewTargetSize
import com.mrousavy.camera.extensions.installHierarchyFitter
import com.mrousavy.camera.extensions.smaller
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.types.CameraDeviceFormat
import com.mrousavy.camera.types.CodeScannerOptions
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.PixelFormat
import com.mrousavy.camera.types.ResizeMode
import com.mrousavy.camera.types.Torch
import com.mrousavy.camera.types.VideoStabilizationMode
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlin.coroutines.CoroutineContext

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
  CoroutineScope,
  SurfaceHolder.Callback {
  companion object {
    const val TAG = "CameraView"
  }

  // react properties
  // props that require reconfiguring
  var cameraId: String? = null
    set(value) {
      if (value != null) {
        // TODO: Move this into CameraSession
        val f = if (format != null) CameraDeviceFormat.fromJSValue(format!!) else null
        previewView.resizeToInputCamera(value, cameraManager, f)
      }
      field = value
    }
  var enableDepthData = false
  var enableHighQualityPhotos: Boolean? = null
  var enablePortraitEffectsMatteDelivery = false

  // use-cases
  var photo: Boolean? = null
  var video: Boolean? = null
  var audio: Boolean? = null
  var enableFrameProcessor = false
  var pixelFormat: PixelFormat = PixelFormat.NATIVE

  // props that require format reconfiguring
  var format: ReadableMap? = null
  var fps: Int? = null
  var videoStabilizationMode: VideoStabilizationMode? = null
  var hdr: Boolean? = null // nullable bool
  var lowLightBoost: Boolean? = null // nullable bool

  // other props
  var isActive = false
  var torch: Torch = Torch.OFF
  var zoom: Float = 1f // in "factor"
  var orientation: Orientation = Orientation.PORTRAIT
  var enableZoomGesture: Boolean = false
    set(value) {
      field = value
      updateZoomGesture()
    }
  var resizeMode: ResizeMode = ResizeMode.COVER
    set(value) {
      previewView.resizeMode = value
      field = value
    }

  // code scanner
  var codeScannerOptions: CodeScannerOptions? = null

  // private properties
  private var isMounted = false
  internal val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager

  // session
  internal val cameraSession: CameraSession
  private val previewView: PreviewView
  private var previewSurface: Surface? = null

  internal var frameProcessor: FrameProcessor? = null
    set(value) {
      field = value
      cameraSession.frameProcessor = frameProcessor
    }

  override val coroutineContext: CoroutineContext = CameraQueues.cameraQueue.coroutineDispatcher

  init {
    this.installHierarchyFitter()
    clipToOutline = true
    cameraSession = CameraSession(context, cameraManager, { invokeOnInitialized() }, { error -> invokeOnError(error) })
    previewView = PreviewView(context, this)
    addView(previewView)
  }

  override fun onAttachedToWindow() {
    if (!isMounted) {
      isMounted = true
      invokeOnViewReady()
    }
    update()
    super.onAttachedToWindow()
  }

  override fun onDetachedFromWindow() {
    update()
    super.onDetachedFromWindow()
  }

  override fun surfaceCreated(holder: SurfaceHolder) {
    Log.i(TAG, "Preview Surface created!")
    previewSurface = holder.surface
    update()
  }
  override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
    Log.i(TAG, "Preview Surface changed ($width x $height @ $format)!")
  }
  override fun surfaceDestroyed(holder: SurfaceHolder) {
    Log.i(TAG, "Preview Surface destroyed!")
    previewSurface = null
    // We need to synchronously tear down the Camera Session before `surfaceDestroyed` callback returns,
    // otherwise the Camera still tries to stream into the destroyed preview surface.
    runBlocking {
      cameraSession.configure { config ->
        config.preview = CameraConfiguration.Output.Disabled.create()
      }
    }
  }

  fun update() {
    Log.i(TAG, "Updating CameraSession...")

    launch {
      cameraSession.configure { config ->
        // Input Camera Device
        config.cameraId = cameraId

        // Preview
        val surface = previewSurface
        Log.d(TAG, "Preview surface: $surface | view: $previewView")
        if (surface != null) {
          config.preview = CameraConfiguration.Output.Enabled.create(CameraConfiguration.Preview(
            surface,
            previewView.size
          ))
        } else {
          config.preview = CameraConfiguration.Output.Disabled.create()
        }

        // Photo
        if (photo == true) {
          config.photo = CameraConfiguration.Output.Enabled.create(CameraConfiguration.Photo())
        } else {
          config.photo = CameraConfiguration.Output.Disabled.create()
        }

        // Video/Frame Processor
        if (video == true || enableFrameProcessor) {
          config.video = CameraConfiguration.Output.Enabled.create(CameraConfiguration.Video(
              pixelFormat,
              enableFrameProcessor
          ))
        } else {
          config.video = CameraConfiguration.Output.Disabled.create()
        }

        // Audio
        if (audio == true) {
          config.audio = CameraConfiguration.Output.Enabled.create(CameraConfiguration.Audio())
        } else {
          config.audio = CameraConfiguration.Output.Disabled.create()
        }

        // Code Scanner
        val codeScanner = codeScannerOptions
        if (codeScanner != null) {
          config.codeScanner = CameraConfiguration.Output.Enabled.create(CameraConfiguration.CodeScanner(
              codeScanner.codeTypes,
              { codes -> invokeOnCodeScanned(codes) },
              { error -> invokeOnError(error) }
          ))
        } else {
          config.codeScanner = CameraConfiguration.Output.Disabled.create()
        }

        // Orientation
        config.orientation = orientation

        // Format
        val format = format
        if (format != null) {
          config.format = CameraDeviceFormat.fromJSValue(format)
        } else {
          config.format = null
        }

        // Side-Props
        config.fps = fps
        config.enableLowLightBoost = lowLightBoost ?: false
        config.enableHdr = hdr ?: false
        config.torch = torch

        // Zoom
        config.zoom = zoom

        // isActive
        config.isActive = isActive && isAttachedToWindow
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
}
