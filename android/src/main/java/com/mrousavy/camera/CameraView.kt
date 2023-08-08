package com.mrousavy.camera

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.hardware.camera2.CameraManager
import android.opengl.GLES32
import android.util.Log
import android.util.Size
import android.view.Surface
import android.view.SurfaceView
import android.view.View
import android.widget.FrameLayout
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.extensions.containsAny
import com.mrousavy.camera.extensions.installHierarchyFitter
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.parsers.Orientation
import com.mrousavy.camera.parsers.PreviewType
import com.mrousavy.camera.parsers.Torch
import com.mrousavy.camera.parsers.VideoStabilizationMode
import com.mrousavy.camera.utils.CameraOutputs
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

@SuppressLint("ClickableViewAccessibility", "ViewConstructor", "MissingPermission")
class CameraView(context: Context) : FrameLayout(context) {
  companion object {
    const val TAG = "CameraView"

    private val propsThatRequirePreviewReconfiguration = arrayListOf("cameraId", "previewType")
    private val propsThatRequireSessionReconfiguration = arrayListOf("cameraId", "format", "photo", "video", "enableFrameProcessor")
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

  var frameProcessor: FrameProcessor? = null

  private val inputOrientation: Orientation
    get() = cameraSession.orientation
  internal val outputOrientation: Orientation
    get() = orientation ?: inputOrientation

  private var minZoom: Float = 1f
  private var maxZoom: Float = 1f

  init {
    this.installHierarchyFitter()
    setupPreviewView()
    cameraSession = CameraSession(context,
                                  cameraManager,
                                  {
                                    invokeOnInitialized()
                                  },
                                  { error ->
                                    invokeOnError(error)
                                  })
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
    when (previewType) {
      PreviewType.NONE -> {
        removeView(this.previewView)
        this.previewView = null
      }
      PreviewType.NATIVE -> {
        removeView(this.previewView)

        val cameraId = cameraId ?: throw NoCameraDeviceError()
        val previewView = NativePreviewView(cameraManager, cameraId, context) { surface ->
          previewSurface = surface
          configureSession()
        }
        previewView.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        addView(previewView)
        this.previewView = previewView
      }
      PreviewType.SKIA -> {
        throw Error("Skia is not yet implemented on Android!")
      }
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

  private fun configureSession() {
    Log.i(TAG, "Configuring Camera Device...")

    if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
      throw CameraPermissionError()
    }
    val cameraId = cameraId ?: throw NoCameraDeviceError()

    val format = format
    val targetVideoSize = if (format != null) Size(format.getInt("videoWidth"), format.getInt("videoHeight")) else null
    val targetPhotoSize = if (format != null) Size(format.getInt("photoWidth"), format.getInt("photoHeight")) else null
    val previewSurface = previewSurface ?: return

    val previewOutput = CameraOutputs.PreviewOutput(previewSurface)
    val photoOutput = if (photo == true) {
      CameraOutputs.PhotoOutput(targetPhotoSize)
    } else null
    val videoOutput = if (video == true) {
      CameraOutputs.VideoOutput({ image ->
        val frame = Frame(image, System.currentTimeMillis(), outputOrientation, false)
        onFrame(frame)
      }, targetVideoSize)
    } else null

    cameraSession.configureSession(cameraId, previewOutput, photoOutput, videoOutput)
  }

  private fun configureFormat() {
    cameraSession.configureFormat(fps, videoStabilizationMode, hdr, lowLightBoost)
  }

  private fun updateLifecycle() {
    cameraSession.setIsActive(isActive && isAttachedToWindow)
  }
}
