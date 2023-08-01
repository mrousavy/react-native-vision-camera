package com.mrousavy.camera

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.graphics.ImageFormat
import android.hardware.camera2.*
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.params.OutputConfiguration
import android.hardware.camera2.params.SessionConfiguration
import android.media.ImageReader
import android.media.ImageReader.OnImageAvailableListener
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.util.Log
import android.view.*
import android.widget.FrameLayout
import androidx.core.content.ContextCompat
import androidx.lifecycle.*
import com.facebook.react.bridge.*
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.parsers.SessionType
import com.mrousavy.camera.parsers.SurfaceOutput
import com.mrousavy.camera.parsers.createCaptureSession
import com.mrousavy.camera.parsers.parseCameraError
import com.mrousavy.camera.utils.*
import kotlinx.coroutines.*
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
@SuppressLint("ClickableViewAccessibility", "ViewConstructor", "MissingPermission")
class CameraView(context: Context) : FrameLayout(context) {
  companion object {
    const val TAG = "CameraView"

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
  private val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager

  // session
  private var cameraSession: CameraCaptureSession? = null
  private val previewView = SurfaceView(context)

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
        if (cameraId != null) configureSession()
      }

      override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
        Log.i(TAG, "PreviewView Surface resized!")
      }

      override fun surfaceDestroyed(holder: SurfaceHolder) {
        Log.i(TAG, "PreviewView Surface destroyed!")
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
        // configureSession()
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
    Log.i(TAG, "Configuring session...")
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
      throw CameraPermissionError()
    }
    val cameraId = cameraId ?: throw NoCameraDeviceError()

    Log.i(TAG, "Opening Camera $cameraId...")
    cameraManager.openCamera(cameraId, object: CameraDevice.StateCallback() {
      override fun onOpened(camera: CameraDevice) {
        Log.i(TAG, "Successfully opened Camera Device $cameraId!")
        CameraQueues.cameraQueue.coroutineScope.launch {
          configureCamera(camera)
        }
      }

      override fun onDisconnected(camera: CameraDevice) {
        Log.i(TAG, "Camera Device $cameraId has been disconnected! Waiting for reconnect to continue session..")
        invokeOnError(CameraDisconnectedError(cameraId))
      }

      override fun onError(camera: CameraDevice, error: Int) {
        Log.e(TAG, "Failed to open Camera Device $cameraId! Error: $error (${parseCameraError(error)})")
        invokeOnError(CameraCannotBeOpenedError(cameraId, parseCameraError(error)))
      }
    }, null)

    // TODO: minZoom = camera!!.cameraInfo.zoomState.value?.minZoomRatio ?: 1f
    // TODO: maxZoom = camera!!.cameraInfo.zoomState.value?.maxZoomRatio ?: 1f
  }

  private suspend fun configureCamera(camera: CameraDevice) {
    val imageReader = ImageReader.newInstance(1920, 1080, ImageFormat.YUV_420_888, 2)

    val characteristics = cameraManager.getCameraCharacteristics(camera.id)
    val isMirrored = characteristics.get(CameraCharacteristics.LENS_FACING) == CameraCharacteristics.LENS_FACING_FRONT

    // Setting up Video / Frame Processor
    imageReader.setOnImageAvailableListener({ reader ->
      Log.d(TAG, "New Image available!")
      val image = reader.acquireNextImage()
      if (image == null) {
        Log.e(TAG, "Failed to get new Image from ImageReader, dropping it...")
      }
      val frame = Frame(image, System.currentTimeMillis(), inputRotation, isMirrored)
      frameProcessor?.call(frame)
    }, CameraQueues.videoQueue.handler)

    val frameProcessorOutput = SurfaceOutput(imageReader.surface, isMirrored)
    val previewOutput = SurfaceOutput(previewView.holder.surface, isMirrored)
    val outputs = listOf(frameProcessorOutput, previewOutput)
    cameraSession = camera.createCaptureSession(SessionType.REGULAR, outputs, CameraQueues.cameraQueue)

    // Start Video / Frame Processor
    val captureRequest = camera.createCaptureRequest(CameraDevice.TEMPLATE_MANUAL)
    captureRequest.addTarget(imageReader.surface)
    captureRequest.addTarget(previewView.holder.surface)
    cameraSession!!.setRepeatingRequest(captureRequest.build(), null, null)

    Log.i(TAG, "Successfully configured Camera Session!")
    invokeOnInitialized()
  }
}
