package com.mrousavy.camera

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.camera2.CameraManager
import android.util.Log
import android.util.Size
import android.view.Gravity
import android.view.ScaleGestureDetector
import android.view.Surface
import android.widget.FrameLayout
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.core.CameraPermissionError
import com.mrousavy.camera.core.CameraQueues
import com.mrousavy.camera.core.CameraSession
import com.mrousavy.camera.core.NoCameraDeviceError
import com.mrousavy.camera.core.PreviewView
import com.mrousavy.camera.core.outputs.CameraOutputs
import com.mrousavy.camera.extensions.bigger
import com.mrousavy.camera.extensions.containsAny
import com.mrousavy.camera.extensions.getPreviewTargetSize
import com.mrousavy.camera.extensions.installHierarchyFitter
import com.mrousavy.camera.extensions.smaller
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.parsers.CodeScanner
import com.mrousavy.camera.parsers.Orientation
import com.mrousavy.camera.parsers.PixelFormat
import com.mrousavy.camera.parsers.ResizeMode
import com.mrousavy.camera.parsers.Torch
import com.mrousavy.camera.parsers.VideoStabilizationMode
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
  CoroutineScope {
  companion object {
    const val TAG = "CameraView"

    private val propsThatRequirePreviewReconfiguration = arrayListOf("cameraId", "format", "resizeMode")
    private val propsThatRequireSessionReconfiguration =
      arrayListOf("cameraId", "format", "photo", "video", "enableFrameProcessor", "codeScannerOptions", "pixelFormat")
    private val propsThatRequireFormatReconfiguration = arrayListOf("fps", "hdr", "videoStabilizationMode", "lowLightBoost")
  }

  // react properties
  // props that require reconfiguring
  var cameraId: String? = null
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
  var resizeMode: ResizeMode = ResizeMode.COVER
  var fps: Int? = null
  var videoStabilizationMode: VideoStabilizationMode? = null
  var hdr: Boolean? = null // nullable bool
  var lowLightBoost: Boolean? = null // nullable bool

  // other props
  var isActive = false
  var torch: Torch = Torch.OFF
  var zoom: Float = 1f // in "factor"
  var orientation: Orientation? = null
  var enableZoomGesture: Boolean = false

  // code scanner
  var codeScannerOptions: CodeScanner? = null

  // private properties
  private var isMounted = false
  internal val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager

  // session
  internal val cameraSession: CameraSession
  private var previewView: PreviewView? = null
  private var previewSurface: Surface? = null

  internal var frameProcessor: FrameProcessor? = null
    set(value) {
      field = value
      cameraSession.frameProcessor = frameProcessor
    }

  private val inputOrientation: Orientation
    get() = cameraSession.orientation
  internal val outputOrientation: Orientation
    get() = orientation ?: inputOrientation

  override val coroutineContext: CoroutineContext = CameraQueues.cameraQueue.coroutineDispatcher

  init {
    this.installHierarchyFitter()
    setupPreviewView()
    cameraSession = CameraSession(context, cameraManager, { invokeOnInitialized() }, { error -> invokeOnError(error) })
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (!isMounted) {
      isMounted = true
      invokeOnViewReady()
    }
    launch { updateLifecycle() }
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    launch { updateLifecycle() }
  }

  private fun getPreviewTargetSize(): Size {
    val cameraId = cameraId ?: throw NoCameraDeviceError()

    val format = format
    val targetPreviewSize = if (format != null) Size(format.getInt("videoWidth"), format.getInt("videoHeight")) else null
    val formatAspectRatio = if (targetPreviewSize != null) targetPreviewSize.bigger.toDouble() / targetPreviewSize.smaller else null

    return this.cameraManager.getCameraCharacteristics(cameraId).getPreviewTargetSize(formatAspectRatio)
  }

  private fun setupPreviewView() {
    removeView(previewView)
    this.previewSurface = null

    if (cameraId == null) return

    val previewView = PreviewView(context, this.getPreviewTargetSize(), resizeMode) { surface ->
      previewSurface = surface
      launch { configureSession() }
    }
    previewView.layoutParams = LayoutParams(
      LayoutParams.MATCH_PARENT,
      LayoutParams.MATCH_PARENT,
      Gravity.CENTER
    )
    addView(previewView)
    this.previewView = previewView
  }

  fun update(changedProps: ArrayList<String>) {
    Log.i(TAG, "Props changed: $changedProps")
    val shouldReconfigurePreview = changedProps.containsAny(propsThatRequirePreviewReconfiguration)
    val shouldReconfigureSession = shouldReconfigurePreview || changedProps.containsAny(propsThatRequireSessionReconfiguration)
    val shouldReconfigureFormat = shouldReconfigureSession || changedProps.containsAny(propsThatRequireFormatReconfiguration)
    val shouldReconfigureZoom = shouldReconfigureSession || changedProps.contains("zoom")
    val shouldReconfigureTorch = shouldReconfigureSession || changedProps.contains("torch")
    val shouldCheckActive = shouldReconfigureFormat || changedProps.contains("isActive")
    val shouldReconfigureZoomGesture = changedProps.contains("enableZoomGesture")

    launch {
      try {
        // Expensive Calls
        if (shouldReconfigurePreview) {
          setupPreviewView()
        }
        if (shouldReconfigureSession) {
          configureSession()
        }
        if (shouldReconfigureFormat) {
          configureFormat()
        }
        if (shouldCheckActive) {
          updateLifecycle()
        }
        // Fast Calls
        if (shouldReconfigureZoom) {
          updateZoom()
        }
        if (shouldReconfigureTorch) {
          updateTorch()
        }
        if (shouldReconfigureZoomGesture) {
          updateZoomGesture()
        }
      } catch (e: Throwable) {
        Log.e(TAG, "update() threw: ${e.message}")
        invokeOnError(e)
      }
    }
  }

  private suspend fun configureSession() {
    try {
      Log.i(TAG, "Configuring Camera Device...")

      if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
        throw CameraPermissionError()
      }
      val cameraId = cameraId ?: throw NoCameraDeviceError()

      val format = format
      val targetVideoSize = if (format != null) Size(format.getInt("videoWidth"), format.getInt("videoHeight")) else null
      val targetPhotoSize = if (format != null) Size(format.getInt("photoWidth"), format.getInt("photoHeight")) else null
      // TODO: Allow previewSurface to be null/none
      val previewSurface = previewSurface ?: return
      val codeScannerOptions = codeScannerOptions

      val previewOutput = CameraOutputs.PreviewOutput(previewSurface, previewView?.targetSize)
      val photoOutput = if (photo == true) {
        CameraOutputs.PhotoOutput(targetPhotoSize)
      } else {
        null
      }
      val videoOutput = if (video == true || enableFrameProcessor) {
        CameraOutputs.VideoOutput(targetVideoSize, video == true, enableFrameProcessor, pixelFormat)
      } else {
        null
      }
      val codeScanner = if (codeScannerOptions != null) {
        CameraOutputs.CodeScannerOutput(
          codeScannerOptions,
          { codes -> invokeOnCodeScanned(codes) },
          { error -> invokeOnError(error) }
        )
      } else {
        null
      }

      cameraSession.configureSession(cameraId, previewOutput, photoOutput, videoOutput, codeScanner)
    } catch (e: Throwable) {
      Log.e(TAG, "Failed to configure session: ${e.message}", e)
      invokeOnError(e)
    }
  }

  private suspend fun configureFormat() {
    cameraSession.configureFormat(fps, videoStabilizationMode, hdr, lowLightBoost)
  }

  private suspend fun updateLifecycle() {
    cameraSession.setIsActive(isActive && isAttachedToWindow)
  }

  private suspend fun updateZoom() {
    cameraSession.setZoom(zoom)
  }

  private suspend fun updateTorch() {
    cameraSession.setTorchMode(torch == Torch.ON)
  }

  @SuppressLint("ClickableViewAccessibility")
  private fun updateZoomGesture() {
    if (enableZoomGesture) {
      val scaleGestureDetector = ScaleGestureDetector(
        context,
        object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
          override fun onScale(detector: ScaleGestureDetector): Boolean {
            zoom *= detector.scaleFactor
            launch { updateZoom() }
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
