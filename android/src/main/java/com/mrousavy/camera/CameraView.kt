package com.mrousavy.camera

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.ImageFormat
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.params.OutputConfiguration
import android.hardware.camera2.params.SessionConfiguration
import android.media.ImageReader
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Surface
import android.widget.FrameLayout
import androidx.core.content.ContextCompat
import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.preview.NativePreviewView
import com.mrousavy.camera.preview.PreviewView
import com.mrousavy.camera.utils.installHierarchyFitter
import java.util.concurrent.ExecutorService

@Suppress("KotlinJniMissingFunction")
class CameraView(context: Context, private val frameProcessorThread: ExecutorService) : FrameLayout(context)  {
  companion object {
    const val TAG = "CameraView"
  }

  // region REACT PROPS
  var cameraId: String? = null
  var enableDepthData: Boolean? = null
  var enableHighQualityPhotos: Boolean? = null
  var enablePortraitEffectsMatteDelivery: Boolean? = null
  // TODO: Does Camera2 have presets we can use over the formats?
  // var preset: String? = null

  var photo: Boolean? = null
  var video: Boolean? = null
  var audio: Boolean? = null
  var enableFrameProcessor: Boolean? = null

  var format: ReadableMap? = null
  var fps: Int? = null
  var hdr: Boolean? = null
  var lowLightBoost: Boolean? = null
  var colorSpace: String? = null
  var orientation: String? = null

  var isActive = false
  var torch: String = "off"
  var zoom: Float = 1f
  var previewType: String = "native"
  var enableZoomGesture = false
  // endregion

  // Internal
  @DoNotStrip
  private var mHybridData: HybridData? = null

  private val cameraHandler = Handler(Looper.getMainLooper())
  private val cameraManager: CameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
  private var previewView: PreviewView? = null
  private var imageReader: ImageReader? = null

  // region LIFECYCLE
  init {
    mHybridData = initHybrid()

    setupPreviewView()
  }

  fun setupPreviewView() {
    if (previewView != null) removeView(previewView)

    previewView = when (previewType) {
      "native" -> NativePreviewView(context)
      "skia" -> TODO("Skia View!")
      else -> throw InvalidTypeScriptUnionError("previewType", previewType)
    }

    previewView!!.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    previewView!!.installHierarchyFitter()
    addView(previewView!!)
    previewView!!.addOnSurfaceChangedListener() { surface ->
      if (surface != null) {
        configureSession(surface)
      }
    }
  }

  fun update(changedProps: ArrayList<String>) {
    // TODO: Which Thread/Handler should we run all of this on?



//    configureSession()
  }


  @SuppressLint("MissingPermission")
  fun configureSession(previewSurface: Surface) {
    // Check if we have permission and a valid camera ID as minimal prereqs for session config
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
      throw CameraPermissionError()
    }
    if (cameraId == null) {
      throw NoCameraDeviceError()
    }
    // Open the camera
    cameraManager.openCamera(cameraId!!, object : CameraDevice.StateCallback() {
      override fun onOpened(camera: CameraDevice) {
        Log.d(TAG, "Camera " + camera.id + " successfully opened")
        configureCaptureSession(camera, previewSurface)
      }

      override fun onDisconnected(camera: CameraDevice) {
        Log.d(TAG, "Camera " + camera.id + " successfully opened")
      }

      override fun onError(camera: CameraDevice, error: Int) {
        val errorMsg = when(error) {
          ERROR_CAMERA_DEVICE -> "Fatal (device)"
          ERROR_CAMERA_DISABLED -> "Device policy"
          ERROR_CAMERA_IN_USE -> "Camera in use"
          ERROR_CAMERA_SERVICE -> "Fatal (service)"
          ERROR_MAX_CAMERAS_IN_USE -> "Maximum cameras in use"
          else -> "Unknown"
        }
        Log.e(TAG, "Error when trying to connect camera $errorMsg")
      }
    }, null)
  }


  fun configureCaptureSession(camera: CameraDevice, previewSurface: Surface) {
    val cameraCharacteristics = cameraManager.getCameraCharacteristics(camera.id)
    val previewSize = cameraCharacteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!.getOutputSizes(
      ImageFormat.JPEG).maxByOrNull { it.height * it.width }!!

    imageReader = ImageReader.newInstance(previewSize.width, previewSize.height, ImageFormat.YUV_420_888, 1)

    val captureSessionStateCallback = object : CameraCaptureSession.StateCallback() {
      override fun onConfigured(captureSession: CameraCaptureSession) {
        val captureRequestBuilder = captureSession.device.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW)
        captureRequestBuilder.addTarget(imageReader!!.surface)
        captureRequestBuilder.addTarget(previewSurface)
        val captureRequest = captureRequestBuilder.build()
        captureSession.setRepeatingRequest(captureRequest, null, cameraHandler)
      }

      override fun onConfigureFailed(captureSession: CameraCaptureSession) {
        TODO("Not yet implemented")
      }
    }

    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
      val outputConfigs = mutableListOf<OutputConfiguration>()
      val outputConfig = OutputConfiguration(imageReader!!.surface)
      outputConfigs.add(outputConfig)

      val sessionConfig = SessionConfiguration(
        SessionConfiguration.SESSION_REGULAR,
        outputConfigs, frameProcessorThread, captureSessionStateCallback)
      camera.createCaptureSession(sessionConfig)
    } else {
      camera.createCaptureSession(listOf(imageReader!!.surface), captureSessionStateCallback, cameraHandler)
    }
  }

  // endregion

  // region CAMERA VIEW METHODS
  fun takePhoto(options: ReadableMap) {

  }

  fun takeSnapshot(options: ReadableMap) {

  }

  fun startRecording(options: ReadableMap, callback: Callback) {

  }

  fun stopRecording() {

  }

  fun pauseRecording() {

  }

  fun resumeRecording() {

  }

  fun focus(point: ReadableMap) {

  }

  // endregion

  private external fun initHybrid(): HybridData
  private external fun frameProcessorCallback(frame: Frame)
}
