package com.mrousavy.camera

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build
import android.util.Log
import android.util.Size
import androidx.camera.core.CameraSelector
import androidx.camera.extensions.ExtensionMode
import androidx.camera.extensions.ExtensionsManager
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.QualitySelector
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.bridge.ReactApplicationContext
import java.util.concurrent.ExecutorService
import com.mrousavy.camera.frameprocessor.FrameProcessorRuntimeManager
import com.mrousavy.camera.parsers.*
import com.mrousavy.camera.utils.*
import kotlinx.coroutines.*
import kotlinx.coroutines.guava.await
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

  private fun findCameraView(viewId: Int): CameraView {
    Log.d(TAG, "Finding view $viewId...")
    val view = if (reactApplicationContext != null) UIManagerHelper.getUIManager(reactApplicationContext, viewId)?.resolveView(viewId) as CameraView? else null
    Log.d(TAG,  if (reactApplicationContext != null) "Found view $viewId!" else "Couldn't find view $viewId!")
    return view ?: throw ViewNotFoundError(viewId)
  }

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

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun installFrameProcessorBindings(): Boolean {
    try {
      frameProcessorManager = FrameProcessorRuntimeManager(reactApplicationContext, frameProcessorThread)
      frameProcessorManager!!.installBindings()
      return true
    } catch (e: Error) {
      Log.e(TAG, "Failed to install Frame Processor JSI Bindings!", e)
      return false
    }
  }

  @ReactMethod
  fun getAvailableCameraDevices(promise: Promise) {
    coroutineScope.launch {
      withPromise(promise) {
        val cameraProvider = ProcessCameraProvider.getInstance(reactApplicationContext).await()
        val extensionsManager = ExtensionsManager.getInstanceAsync(reactApplicationContext, cameraProvider).await()
        val manager = reactApplicationContext.getSystemService(Context.CAMERA_SERVICE) as CameraManager

        val devices = Arguments.createArray()
        manager.cameraIdList.forEach { cameraId ->
          val device = CameraDevice(manager, extensionsManager, cameraId)
          devices.pushMap(device.toMap())
        }
        promise.resolve(devices)
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
