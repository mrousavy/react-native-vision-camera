package com.mrousavy.camera

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.hardware.camera2.*
import android.util.Log
import android.view.*
import android.widget.FrameLayout
import androidx.core.content.ContextCompat
import androidx.lifecycle.*
import com.facebook.react.bridge.*
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.utils.*
import kotlinx.coroutines.*
import java.lang.IllegalArgumentException
import java.util.concurrent.ExecutorService
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
class CameraView(context: Context, private val frameProcessorThread: ExecutorService) : FrameLayout(context) {
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
  var orientation: String? = null

  // private properties
  private var isMounted = false

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
        configureSession()
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
    try {
      val startTime = System.currentTimeMillis()
      Log.i(TAG, "Configuring session...")
      if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
        throw CameraPermissionError()
      }
      if (cameraId == null) {
        throw NoCameraDeviceError()
      }

      // TODO: minZoom = camera!!.cameraInfo.zoomState.value?.minZoomRatio ?: 1f
      // TODO: maxZoom = camera!!.cameraInfo.zoomState.value?.maxZoomRatio ?: 1f

      val duration = System.currentTimeMillis() - startTime
      Log.i(TAG_PERF, "Session configured in $duration ms!")
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
}
