package com.mrousavy.camera

import android.annotation.SuppressLint
import android.content.Context
import android.hardware.camera2.CameraManager
import android.util.Log
import android.view.ScaleGestureDetector
import android.widget.FrameLayout
import com.facebook.react.bridge.ReadableMap
import com.google.mlkit.vision.barcode.common.Barcode
import com.mrousavy.camera.core.CameraConfiguration
import com.mrousavy.camera.core.CameraQueues
import com.mrousavy.camera.core.CameraSession
import com.mrousavy.camera.core.CodeScannerFrame
import com.mrousavy.camera.core.PreviewView
import com.mrousavy.camera.extensions.installHierarchyFitter
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.types.CameraDeviceFormat
import com.mrousavy.camera.types.CodeScannerOptions
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.PixelFormat
import com.mrousavy.camera.types.ResizeMode
import com.mrousavy.camera.types.Torch
import com.mrousavy.camera.types.VideoStabilizationMode
import kotlin.coroutines.CoroutineContext
import kotlinx.coroutines.CoroutineScope
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
  CoroutineScope,
  CameraSession.CameraSessionCallback {
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
  var videoHdr = false
  var photoHdr = false
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

  internal var frameProcessor: FrameProcessor? = null
    set(value) {
      field = value
      cameraSession.frameProcessor = frameProcessor
    }

  override val coroutineContext: CoroutineContext = CameraQueues.cameraQueue.coroutineDispatcher

  init {
    this.installHierarchyFitter()
    clipToOutline = true
    cameraSession = CameraSession(context, cameraManager, this)
    previewView = cameraSession.createPreviewView(context)
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

  fun destroy() {
    cameraSession.close()
  }

  fun update() {
    Log.i(TAG, "Updating CameraSession...")

    launch {
      cameraSession.configure { config ->
        // Input Camera Device
        config.cameraId = cameraId

        // Photo
        if (photo == true) {
          config.photo = CameraConfiguration.Output.Enabled.create(CameraConfiguration.Photo(Unit))
        } else {
          config.photo = CameraConfiguration.Output.Disabled.create()
        }

        // Video/Frame Processor
        if (video == true || enableFrameProcessor) {
          config.video = CameraConfiguration.Output.Enabled.create(
            CameraConfiguration.Video(
              pixelFormat,
              enableFrameProcessor
            )
          )
        } else {
          config.video = CameraConfiguration.Output.Disabled.create()
        }

        // Audio
        if (audio == true) {
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

        // HDR
        config.videoHdr = videoHdr
        config.photoHdr = photoHdr

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

  override fun onError(error: Throwable) {
    invokeOnError(error)
  }

  override fun onInitialized() {
    invokeOnInitialized()
  }

  override fun onCodeScanned(codes: List<Barcode>, scannerFrame: CodeScannerFrame) {
    invokeOnCodeScanned(codes, scannerFrame)
  }
}
