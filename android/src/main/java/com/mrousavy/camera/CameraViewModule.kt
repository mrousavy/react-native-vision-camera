package com.mrousavy.camera

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build
import android.util.Log
import androidx.camera.core.CameraSelector
import androidx.camera.extensions.ExtensionMode
import androidx.camera.extensions.ExtensionsManager
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import com.mrousavy.camera.frameprocessor.FrameProcessorRuntimeManager
import com.mrousavy.camera.parsers.*
import com.mrousavy.camera.utils.*
import kotlinx.coroutines.*
import kotlinx.coroutines.guava.await
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

@ReactModule(name = CameraViewModule.TAG)
@Suppress("unused")
class CameraViewModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    const val TAG = "CameraView"
    var RequestCode = 10

    fun parsePermissionStatus(status: Int): String {
      return when (status) {
        PackageManager.PERMISSION_DENIED -> "denied"
        PackageManager.PERMISSION_GRANTED -> "authorized"
        else -> "not-determined"
      }
    }
  }

  var frameProcessorThread: ExecutorService = Executors.newSingleThreadExecutor()
  private val coroutineScope = CoroutineScope(Dispatchers.Default) // TODO: or Dispatchers.Main?
  private var frameProcessorManager: FrameProcessorRuntimeManager? = null

  private fun cleanup() {
    if (coroutineScope.isActive) {
      coroutineScope.cancel("CameraViewModule has been destroyed.")
    }
    frameProcessorManager = null
  }

  override fun initialize() {
    super.initialize()

    if (frameProcessorManager == null) {
      frameProcessorThread.execute {
        frameProcessorManager = FrameProcessorRuntimeManager(reactApplicationContext, frameProcessorThread)
      }
    }
  }

  override fun onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy()
    cleanup()
  }

  override fun invalidate() {
    super.invalidate()
    cleanup()
  }

  override fun getName(): String {
    return TAG
  }

  private fun findCameraView(id: Int): CameraView = reactApplicationContext.currentActivity?.findViewById(id) ?: throw ViewNotFoundError(id)

  @ReactMethod
  fun takePhoto(viewTag: Int, options: ReadableMap, promise: Promise) {
    coroutineScope.launch {
      withPromise(promise) {
        val view = findCameraView(viewTag)
        view.takePhoto(options)
      }
    }
  }

  @Suppress("unused")
  @ReactMethod
  fun takeSnapshot(viewTag: Int, options: ReadableMap, promise: Promise) {
    coroutineScope.launch {
      withPromise(promise) {
        val view = findCameraView(viewTag)
        view.takeSnapshot(options)
      }
    }
  }

  // TODO: startRecording() cannot be awaited, because I can't have a Promise and a onRecordedCallback in the same function. Hopefully TurboModules allows that
  @ReactMethod
  fun startRecording(viewTag: Int, options: ReadableMap, onRecordCallback: Callback) {
    coroutineScope.launch {
      val view = findCameraView(viewTag)
      try {
        view.startRecording(options, onRecordCallback)
      } catch (error: CameraError) {
        val map = makeErrorMap("${error.domain}/${error.id}", error.message, error)
        onRecordCallback(null, map)
      } catch (error: Throwable) {
        val map = makeErrorMap("capture/unknown", "An unknown error occurred while trying to start a video recording!", error)
        onRecordCallback(null, map)
      }
    }
  }

  @ReactMethod
  fun pauseRecording(viewTag: Int, promise: Promise) {
    withPromise(promise) {
      val view = findCameraView(viewTag)
      view.pauseRecording()
      return@withPromise null
    }
  }

  @ReactMethod
  fun resumeRecording(viewTag: Int, promise: Promise) {
    withPromise(promise) {
      val view = findCameraView(viewTag)
      view.resumeRecording()
      return@withPromise null
    }
  }

  @ReactMethod
  fun stopRecording(viewTag: Int, promise: Promise) {
    withPromise(promise) {
      val view = findCameraView(viewTag)
      view.stopRecording()
      return@withPromise null
    }
  }

  @ReactMethod
  fun focus(viewTag: Int, point: ReadableMap, promise: Promise) {
    coroutineScope.launch {
      withPromise(promise) {
        val view = findCameraView(viewTag)
        view.focus(point)
        return@withPromise null
      }
    }
  }

  // TODO: This uses the Camera2 API to list all characteristics of a camera device and therefore doesn't work with Camera1. Find a way to use CameraX for this
  // https://issuetracker.google.com/issues/179925896
  @ReactMethod
  fun getAvailableCameraDevices(promise: Promise) {
    val startTime = System.currentTimeMillis()
    coroutineScope.launch {
      withPromise(promise) {
        val cameraProvider = ProcessCameraProvider.getInstance(reactApplicationContext).await()
        val extensionsManager = ExtensionsManager.getInstanceAsync(reactApplicationContext, cameraProvider).await()
        ProcessCameraProvider.getInstance(reactApplicationContext).await()

        val manager = reactApplicationContext.getSystemService(Context.CAMERA_SERVICE) as? CameraManager
          ?: throw CameraManagerUnavailableError()

        val cameraDevices: WritableArray = Arguments.createArray()

        manager.cameraIdList.forEach loop@{ id ->
          val cameraSelector = CameraSelector.Builder().byID(id).build()

          val characteristics = manager.getCameraCharacteristics(id)
          val hardwareLevel = characteristics.get(CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL)!!

          val capabilities = characteristics.get(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES)!!
          val isMultiCam = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P &&
            capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_LOGICAL_MULTI_CAMERA)
          val deviceTypes = characteristics.getDeviceTypes()

          val cameraConfig = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
          val lensFacing = characteristics.get(CameraCharacteristics.LENS_FACING)!!
          val hasFlash = characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE)!!
          val maxScalerZoom = characteristics.get(CameraCharacteristics.SCALER_AVAILABLE_MAX_DIGITAL_ZOOM)!!
          val supportsDepthCapture = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
            capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_DEPTH_OUTPUT)
          val supportsRawCapture = capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_RAW)
          val isoRange = characteristics.get(CameraCharacteristics.SENSOR_INFO_SENSITIVITY_RANGE)
          val digitalStabilizationModes = characteristics.get(CameraCharacteristics.CONTROL_AVAILABLE_VIDEO_STABILIZATION_MODES)
          val opticalStabilizationModes = characteristics.get(CameraCharacteristics.LENS_INFO_AVAILABLE_OPTICAL_STABILIZATION)
          val zoomRange = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
            characteristics.get(CameraCharacteristics.CONTROL_ZOOM_RATIO_RANGE)
          else null
          val name = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P)
            characteristics.get(CameraCharacteristics.INFO_VERSION)
          else null
          val fpsRanges = characteristics.get(CameraCharacteristics.CONTROL_AE_AVAILABLE_TARGET_FPS_RANGES)!!

          val supportsHdr = extensionsManager.isExtensionAvailable(cameraSelector, ExtensionMode.HDR)
          val supportsLowLightBoost = extensionsManager.isExtensionAvailable(cameraSelector, ExtensionMode.NIGHT)
          // see https://developer.android.com/reference/android/hardware/camera2/CameraDevice#regular-capture
          val supportsParallelVideoProcessing = hardwareLevel != CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY && hardwareLevel != CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LIMITED

          val fieldOfView = characteristics.getFieldOfView()

          val map = Arguments.createMap()
          map.putString("id", id)
          map.putArray("devices", deviceTypes)
          map.putString("position", parseLensFacing(lensFacing))
          map.putString("name", name ?: "${parseLensFacing(lensFacing)} ($id)")
          map.putBoolean("hasFlash", hasFlash)
          map.putBoolean("hasTorch", hasFlash)
          map.putBoolean("isMultiCam", isMultiCam)
          map.putBoolean("supportsParallelVideoProcessing", supportsParallelVideoProcessing)
          map.putBoolean("supportsRawCapture", supportsRawCapture)
          map.putBoolean("supportsDepthCapture", supportsDepthCapture)
          map.putBoolean("supportsLowLightBoost", supportsLowLightBoost)
          map.putBoolean("supportsFocus", true) // I believe every device here supports focussing
          if (zoomRange != null) {
            map.putDouble("minZoom", zoomRange.lower.toDouble())
            map.putDouble("maxZoom", zoomRange.upper.toDouble())
          } else {
            map.putDouble("minZoom", 1.0)
            map.putDouble("maxZoom", maxScalerZoom.toDouble())
          }
          map.putDouble("neutralZoom", 1.0)

          // TODO: Optimize?
          val maxImageOutputSize = cameraConfig.outputFormats
            .flatMap { cameraConfig.getOutputSizes(it).toList() }
            .maxByOrNull { it.width * it.height }!!

          val formats = Arguments.createArray()

          // TODO: Get supported video qualities with QualitySelector.getSupportedQualities(...)
          cameraConfig.outputFormats.forEach { formatId ->
            val formatName = parseImageFormat(formatId)

            cameraConfig.getOutputSizes(formatId).forEach { size ->
              val isHighestPhotoQualitySupported = areUltimatelyEqual(size, maxImageOutputSize)

              // Get the number of seconds that each frame will take to process
              val secondsPerFrame = try {
                cameraConfig.getOutputMinFrameDuration(formatId, size) / 1_000_000_000.0
              } catch (error: Throwable) {
                Log.e(TAG, "Minimum Frame Duration for MediaRecorder Output cannot be calculated, format \"$formatName\" is not supported.")
                null
              }

              val frameRateRanges = Arguments.createArray()
              if (secondsPerFrame != null && secondsPerFrame > 0) {
                val fps = (1.0 / secondsPerFrame).toInt()
                val frameRateRange = Arguments.createMap()
                frameRateRange.putInt("minFrameRate", 1)
                frameRateRange.putInt("maxFrameRate", fps)
                frameRateRanges.pushMap(frameRateRange)
              }
              fpsRanges.forEach { range ->
                val frameRateRange = Arguments.createMap()
                frameRateRange.putInt("minFrameRate", range.lower)
                frameRateRange.putInt("maxFrameRate", range.upper)
                frameRateRanges.pushMap(frameRateRange)
              }

              val colorSpaces = Arguments.createArray()
              colorSpaces.pushString(formatName)

              val videoStabilizationModes = Arguments.createArray()
              videoStabilizationModes.pushString("off")
              if (digitalStabilizationModes != null) {
                if (digitalStabilizationModes.contains(CameraCharacteristics.CONTROL_VIDEO_STABILIZATION_MODE_ON)) {
                  videoStabilizationModes.pushString("auto")
                  videoStabilizationModes.pushString("standard")
                }
              }
              if (opticalStabilizationModes != null) {
                if (opticalStabilizationModes.contains(CameraCharacteristics.LENS_OPTICAL_STABILIZATION_MODE_ON)) {
                  videoStabilizationModes.pushString("cinematic")
                }
              }

              // TODO: Get the pixel format programatically rather than assuming a default of 420v
              val pixelFormat = "420v"

              val format = Arguments.createMap()
              format.putDouble("photoHeight", size.height.toDouble())
              format.putDouble("photoWidth", size.width.toDouble())
              format.putDouble("videoHeight", size.height.toDouble()) // TODO: Revisit getAvailableCameraDevices (videoHeight == photoHeight?)
              format.putDouble("videoWidth", size.width.toDouble()) // TODO: Revisit getAvailableCameraDevices (videoWidth == photoWidth?)
              format.putBoolean("isHighestPhotoQualitySupported", isHighestPhotoQualitySupported)
              format.putInt("maxISO", isoRange?.upper)
              format.putInt("minISO", isoRange?.lower)
              format.putDouble("fieldOfView", fieldOfView) // TODO: Revisit getAvailableCameraDevices (is fieldOfView accurate?)
              format.putDouble("maxZoom", (zoomRange?.upper ?: maxScalerZoom).toDouble())
              format.putArray("colorSpaces", colorSpaces)
              format.putBoolean("supportsVideoHDR", false) // TODO: supportsVideoHDR
              format.putBoolean("supportsPhotoHDR", supportsHdr)
              format.putArray("frameRateRanges", frameRateRanges)
              format.putString("autoFocusSystem", "none") // TODO: Revisit getAvailableCameraDevices (autoFocusSystem) (CameraCharacteristics.CONTROL_AF_AVAILABLE_MODES or CameraCharacteristics.LENS_INFO_FOCUS_DISTANCE_CALIBRATION)
              format.putArray("videoStabilizationModes", videoStabilizationModes)
              format.putString("pixelFormat", pixelFormat)
              formats.pushMap(format)
            }
          }

          map.putArray("formats", formats)
          cameraDevices.pushMap(map)
        }

        val difference = System.currentTimeMillis() - startTime
        Log.w(TAG, "CameraViewModule::getAvailableCameraDevices took: $difference ms")
        return@withPromise cameraDevices
      }
    }
  }

  @ReactMethod
  fun getCameraPermissionStatus(promise: Promise) {
    val status = ContextCompat.checkSelfPermission(reactApplicationContext, Manifest.permission.CAMERA)
    promise.resolve(parsePermissionStatus(status))
  }

  @ReactMethod
  fun getMicrophonePermissionStatus(promise: Promise) {
    val status = ContextCompat.checkSelfPermission(reactApplicationContext, Manifest.permission.RECORD_AUDIO)
    promise.resolve(parsePermissionStatus(status))
  }

  @ReactMethod
  fun requestCameraPermission(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      // API 21 and below always grants permission on app install
      return promise.resolve("authorized")
    }

    val activity = reactApplicationContext.currentActivity
    if (activity is PermissionAwareActivity) {
      val currentRequestCode = RequestCode++
      val listener = PermissionListener { requestCode: Int, _: Array<String>, grantResults: IntArray ->
        if (requestCode == currentRequestCode) {
          val permissionStatus = if (grantResults.isNotEmpty()) grantResults[0] else PackageManager.PERMISSION_DENIED
          promise.resolve(parsePermissionStatus(permissionStatus))
          return@PermissionListener true
        }
        return@PermissionListener false
      }
      activity.requestPermissions(arrayOf(Manifest.permission.CAMERA), currentRequestCode, listener)
    } else {
      promise.reject("NO_ACTIVITY", "No PermissionAwareActivity was found! Make sure the app has launched before calling this function.")
    }
  }

  @ReactMethod
  fun requestMicrophonePermission(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      // API 21 and below always grants permission on app install
      return promise.resolve("authorized")
    }

    val activity = reactApplicationContext.currentActivity
    if (activity is PermissionAwareActivity) {
      val currentRequestCode = RequestCode++
      val listener = PermissionListener { requestCode: Int, _: Array<String>, grantResults: IntArray ->
        if (requestCode == currentRequestCode) {
          val permissionStatus = if (grantResults.isNotEmpty()) grantResults[0] else PackageManager.PERMISSION_DENIED
          promise.resolve(parsePermissionStatus(permissionStatus))
          return@PermissionListener true
        }
        return@PermissionListener false
      }
      activity.requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), currentRequestCode, listener)
    } else {
      promise.reject("NO_ACTIVITY", "No PermissionAwareActivity was found! Make sure the app has launched before calling this function.")
    }
  }
}
