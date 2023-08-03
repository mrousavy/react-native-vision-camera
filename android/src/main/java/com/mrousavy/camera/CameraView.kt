package com.mrousavy.camera

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.graphics.ImageFormat
import android.graphics.PixelFormat
import android.hardware.camera2.*
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.params.StreamConfigurationMap
import android.media.ImageReader
import android.os.Build
import android.util.Log
import android.util.Range
import android.util.Size
import android.view.*
import android.widget.FrameLayout
import androidx.core.content.ContextCompat
import androidx.core.view.isVisible
import androidx.lifecycle.*
import com.facebook.react.bridge.*
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.parsers.getVideoStabilizationMode
import com.mrousavy.camera.utils.OutputType
import com.mrousavy.camera.utils.SessionType
import com.mrousavy.camera.utils.SurfaceOutput
import com.mrousavy.camera.utils.createCaptureSession
import com.mrousavy.camera.parsers.parseCameraError
import com.mrousavy.camera.parsers.parseHardwareLevel
import com.mrousavy.camera.parsers.parseVideoStabilizationMode
import com.mrousavy.camera.utils.*
import kotlinx.coroutines.*
import java.lang.IllegalArgumentException
import kotlin.coroutines.coroutineContext
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine
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

    private val propsThatRequireDeviceReconfiguration = arrayListOf("cameraId")
    private val propsThatRequireSessionReconfiguration = arrayListOf("format", "photo", "video", "enableFrameProcessor")
    private val propsThatRequireFormatReconfiguration = arrayListOf("fps", "hdr", "videoStabilizationMode", "lowLightBoost")
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
  var videoStabilizationMode: String? = null
  var hdr: Boolean? = null // nullable bool
  var lowLightBoost: Boolean? = null // nullable bool
  var previewType: String = "native"
  // other props
  var isActive = false
  var torch = "off"
  var zoom: Float = 1f // in "factor"
  var orientation: String? = null

  // private properties
  private var isMounted = false
  private val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager

  // session
  private var cameraDevice: CameraDevice? = null
  private var cameraSession: CameraSession? = null
  private val previewView = SurfaceView(context)
  private var isPreviewSurfaceReady = false

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
    this.installHierarchyFitter()
    previewView.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    previewView.holder.addCallback(object : SurfaceHolder.Callback {
      override fun surfaceCreated(holder: SurfaceHolder) {
        Log.i(TAG, "PreviewView Surface created!")
        isPreviewSurfaceReady = true
        reconfigureAll()
      }

      override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
        Log.i(TAG, "PreviewView Surface resized!")
        isPreviewSurfaceReady = true
        reconfigureAll()
      }

      override fun surfaceDestroyed(holder: SurfaceHolder) {
        Log.i(TAG, "PreviewView Surface destroyed!")
        isPreviewSurfaceReady = false
        reconfigureAll()
      }
    })
    addView(previewView)
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

  /**
   * Invalidate all React Props and reconfigure the device
   */
  fun update(changedProps: ArrayList<String>) {
    try {
      val shouldReconfigureDevice = changedProps.containsAny(propsThatRequireDeviceReconfiguration)
      val shouldReconfigureSession =  shouldReconfigureDevice || changedProps.containsAny(propsThatRequireSessionReconfiguration)
      val shouldReconfigureFormat = shouldReconfigureSession || changedProps.containsAny(propsThatRequireFormatReconfiguration)
      val shouldReconfigureZoom = /* TODO: When should we reconfigure this? */ shouldReconfigureSession || changedProps.contains("zoom")
      val shouldReconfigureTorch = /* TODO: When should we reconfigure this? */ shouldReconfigureSession || changedProps.contains("torch")
      val shouldUpdateOrientation = /* TODO: When should we reconfigure this? */ shouldReconfigureSession ||  changedProps.contains("orientation")
      val shouldCheckActive = shouldReconfigureFormat || changedProps.contains("isActive")

      CameraQueues.cameraQueue.coroutineScope.launch {
        try {
          if (shouldReconfigureDevice) {
            configureDevice()
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
        } catch (e: Throwable) {
          Log.e(TAG, "Failed to configure Camera!", e)
          invokeOnError(e)
        }
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
   * Prepares the hardware Camera Device. (cameraId)
   */
  private suspend fun configureDevice() {
    Log.i(TAG, "Configuring Camera Device...")
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
      throw CameraPermissionError()
    }
    val cameraId = cameraId ?: throw NoCameraDeviceError()

    cameraDevice = cameraManager.openCamera(cameraId) {
      Log.i(TAG, "Camera Closed!")
      cameraSession?.close()
      cameraSession = null
      cameraDevice = null
    }
  }

  private suspend fun configureSession() {
    val cameraDevice = cameraDevice
    if (cameraDevice == null) {
      Log.w(TAG, "Tried to call configureSession() without a CameraDevice! Returning...")
      return
    }

    val format = format
    val targetVideoSize = if (format != null) Size(format.getInt("videoWidth"), format.getInt("videoHeight")) else null
    val targetPhotoSize = if (format != null) Size(format.getInt("photoWidth"), format.getInt("photoHeight")) else null
    val previewSurface = if (previewType == "native") previewView.holder.surface else null

    cameraSession = CameraSession.createCameraSession(
      cameraDevice,
      cameraManager,
      // Photo Pipeline
      PipelineConfiguration(video == true, {
        Log.i(TAG, "Captured an Image!")
      }, targetPhotoSize),
      // Video Pipeline
      PipelineConfiguration(photo == true, { image ->
        val frame = Frame(image, System.currentTimeMillis(), inputRotation, false)
        onFrame(frame)
      }, targetVideoSize),
      // Preview Pipeline
      previewSurface
    )
  }

  private fun configureFormat() {
    cameraSession?.configureFormat(fps, videoStabilizationMode, hdr, lowLightBoost)
  }

  private fun updateLifecycle() {
    val cameraSession = cameraSession
    if (isActive && isAttachedToWindow && cameraSession != null) {
      Log.i(TAG, "Starting Camera Session...")
      cameraSession.startRunning()
    } else {
      Log.i(TAG, "Stopping Camera Session...")
      cameraSession?.stopRunning()
    }
  }

  private fun reconfigureAll() {
    CameraQueues.cameraQueue.coroutineScope.launch {
      configureDevice()
      configureSession()
      configureFormat()
      updateLifecycle()
    }
  }
}
