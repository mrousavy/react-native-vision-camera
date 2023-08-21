package com.mrousavy.camera

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.hardware.camera2.CameraManager
import android.util.Log
import android.util.Size
import android.view.Surface
import android.view.View
import android.widget.FrameLayout
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.extensions.containsAny
import com.mrousavy.camera.extensions.installHierarchyFitter
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.parsers.PixelFormat
import com.mrousavy.camera.parsers.Orientation
import com.mrousavy.camera.parsers.PreviewType
import com.mrousavy.camera.parsers.Torch
import com.mrousavy.camera.parsers.VideoStabilizationMode
import com.mrousavy.camera.skia.SkiaPreviewView
import com.mrousavy.camera.skia.SkiaRenderer
import com.mrousavy.camera.utils.outputs.CameraOutputs
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.Closeable

//
// TODOs for the CameraView which are currently too hard to implement either because of CameraX' limitations, or my brain capacity.
//
// CameraView
// TODO: High-speed video recordings (export in CameraViewModule::getAvailableVideoDevices(), and set in CameraView::configurePreview()) (120FPS+)
// TODO: configureSession() enableDepthData
// TODO: configureSession() enablePortraitEffectsMatteDelivery

// CameraView+RecordVideo
// TODO: Better startRecording()/stopRecording() (promise + callback, wait for TurboModules/JSI)

// CameraView+TakePhoto
// TODO: takePhoto() depth data
// TODO: takePhoto() raw capture
// TODO: takePhoto() photoCodec ("hevc" | "jpeg" | "raw")
// TODO: takePhoto() return with jsi::Value Image reference for faster capture

@SuppressLint("ClickableViewAccessibility", "ViewConstructor", "MissingPermission")
class CameraView(context: Context) : FrameLayout(context) {
  companion object {
    const val TAG = "CameraView"

    private val propsThatRequirePreviewReconfiguration = arrayListOf("cameraId", "previewType")
    private val propsThatRequireSessionReconfiguration = arrayListOf("cameraId", "format", "photo", "video", "enableFrameProcessor", "pixelFormat")
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
  var fps: Int? = null
  var videoStabilizationMode: VideoStabilizationMode? = null
  var hdr: Boolean? = null // nullable bool
  var lowLightBoost: Boolean? = null // nullable bool
  var previewType: PreviewType = PreviewType.NONE
  // other props
  var isActive = false
  var torch: Torch = Torch.OFF
  var zoom: Float = 1f // in "factor"
  var orientation: Orientation? = null

  // private properties
  private var isMounted = false
  internal val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager

  // session
  internal val cameraSession: CameraSession
  private var previewView: View? = null
  private var previewSurface: Surface? = null

  private var skiaRenderer: SkiaRenderer? = null
  internal var frameProcessor: FrameProcessor? = null
    set(value) {
      field = value
      cameraSession.setFrameProcessor(frameProcessor)
    }

  private val inputOrientation: Orientation
    get() = cameraSession.orientation
  internal val outputOrientation: Orientation
    get() = orientation ?: inputOrientation

  private var minZoom: Float = 1f
  private var maxZoom: Float = 1f

  init {
    this.installHierarchyFitter()
    setupPreviewView()
    cameraSession = CameraSession(context, cameraManager, { invokeOnInitialized() }, { error -> invokeOnError(error) })
  }

  override fun onConfigurationChanged(newConfig: Configuration?) {
    super.onConfigurationChanged(newConfig)
    // TODO: updateOrientation()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (!isMounted) {
      isMounted = true
      invokeOnViewReady()
    }
    updateLifecycle()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    updateLifecycle()
  }

  private fun setupPreviewView() {
    this.previewView?.let { previewView ->
      removeView(previewView)
      if (previewView is Closeable) previewView.close()
    }
    this.previewSurface = null

    when (previewType) {
      PreviewType.NONE -> {
        // Do nothing.
      }
      PreviewType.NATIVE -> {
        val cameraId = cameraId ?: throw NoCameraDeviceError()
        this.previewView = NativePreviewView(context, cameraManager, cameraId) { surface ->
          previewSurface = surface
          configureSession()
        }
      }
      PreviewType.SKIA -> {
        if (skiaRenderer == null) skiaRenderer = SkiaRenderer()
        this.previewView = SkiaPreviewView(context, skiaRenderer!!)
        configureSession()
      }
    }

    this.previewView?.let { previewView ->
      previewView.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
      addView(previewView)
    }
  }

  fun update(changedProps: ArrayList<String>) {
    Log.i(TAG, "Props changed: $changedProps")
    try {
      val shouldReconfigurePreview = changedProps.containsAny(propsThatRequirePreviewReconfiguration)
      val shouldReconfigureSession =  shouldReconfigurePreview || changedProps.containsAny(propsThatRequireSessionReconfiguration)
      val shouldReconfigureFormat = shouldReconfigureSession || changedProps.containsAny(propsThatRequireFormatReconfiguration)
      val shouldReconfigureZoom = /* TODO: When should we reconfigure this? */ shouldReconfigureSession || changedProps.contains("zoom")
      val shouldReconfigureTorch = /* TODO: When should we reconfigure this? */ shouldReconfigureSession || changedProps.contains("torch")
      val shouldUpdateOrientation = /* TODO: When should we reconfigure this? */ shouldReconfigureSession ||  changedProps.contains("orientation")
      val shouldCheckActive = shouldReconfigureFormat || changedProps.contains("isActive")

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

      if (shouldReconfigureZoom) {
        updateZoom()
      }
      if (shouldReconfigureTorch) {
        updateTorch()
      }
      if (shouldUpdateOrientation) {
        // TODO: updateOrientation()
      }
    } catch (e: Throwable) {
      Log.e(TAG, "update() threw: ${e.message}")
      invokeOnError(e)
    }
  }

  private fun configureSession() {
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

      if (targetVideoSize != null) skiaRenderer?.setInputSurfaceSize(targetVideoSize.width, targetVideoSize.height)

      val previewOutput = CameraOutputs.PreviewOutput(previewSurface)
      val photoOutput = if (photo == true) {
        CameraOutputs.PhotoOutput(targetPhotoSize)
      } else null
      val videoOutput = if (video == true || enableFrameProcessor) {
        CameraOutputs.VideoOutput(targetVideoSize, video == true, enableFrameProcessor, pixelFormat.toImageFormat())
      } else null

      cameraSession.configureSession(cameraId, previewOutput, photoOutput, videoOutput)
    } catch (e: Throwable) {
      Log.e(TAG, "Failed to configure session: ${e.message}", e)
      invokeOnError(e)
    }
  }

  private fun configureFormat() {
    cameraSession.configureFormat(fps, videoStabilizationMode, hdr, lowLightBoost)
  }

  private fun updateLifecycle() {
    cameraSession.setIsActive(isActive && isAttachedToWindow)
  }

  private fun updateZoom() {
    cameraSession.setZoom(zoom)
  }

  private fun updateTorch() {
    CoroutineScope(Dispatchers.Default).launch {
      cameraSession.setTorchMode(torch == Torch.ON)
    }
  }
}
