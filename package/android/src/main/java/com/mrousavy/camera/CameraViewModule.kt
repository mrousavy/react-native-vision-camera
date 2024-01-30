package com.mrousavy.camera

import android.Manifest
import android.content.pm.PackageManager
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import com.facebook.react.uimanager.UIManagerHelper
import com.mrousavy.camera.core.CameraError
import com.mrousavy.camera.core.CameraQueues
import com.mrousavy.camera.core.ViewNotFoundError
import com.mrousavy.camera.frameprocessor.VisionCameraInstaller
import com.mrousavy.camera.frameprocessor.VisionCameraProxy
import com.mrousavy.camera.types.*
import com.mrousavy.camera.utils.*
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine
import kotlinx.coroutines.*

@ReactModule(name = CameraViewModule.TAG)
@Suppress("unused")
class CameraViewModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    const val TAG = "CameraView"
    var sharedRequestCode = 10

    init {
      try {
        // Load the native part of VisionCamera.
        // Includes the OpenGL VideoPipeline, as well as Frame Processor JSI bindings
        System.loadLibrary("VisionCamera")
      } catch (e: UnsatisfiedLinkError) {
        Log.e(VisionCameraProxy.TAG, "Failed to load VisionCamera C++ library!", e)
        throw e
      }
    }
  }

  private val coroutineScope = CoroutineScope(CameraQueues.cameraQueue.coroutineDispatcher)

  override fun invalidate() {
    super.invalidate()
    if (coroutineScope.isActive) {
      coroutineScope.cancel("CameraViewModule has been destroyed.")
    }
  }

  override fun getName(): String = TAG

  private suspend fun findCameraView(viewId: Int): CameraView =
    suspendCoroutine { continuation ->
      UiThreadUtil.runOnUiThread {
        Log.d(TAG, "Finding view $viewId...")
        val view = if (reactApplicationContext != null) {
          UIManagerHelper.getUIManager(
            reactApplicationContext,
            viewId
          )?.resolveView(viewId) as CameraView?
        } else {
          null
        }
        Log.d(TAG, if (reactApplicationContext != null) "Found view $viewId!" else "Couldn't find view $viewId!")
        if (view != null) {
          continuation.resume(view)
        } else {
          continuation.resumeWithException(ViewNotFoundError(viewId))
        }
      }
    }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun installFrameProcessorBindings(): Boolean =
    try {
      val proxy = VisionCameraProxy(reactApplicationContext)
      VisionCameraInstaller.install(proxy)
      true
    } catch (e: Error) {
      Log.e(TAG, "Failed to install Frame Processor JSI Bindings!", e)
      false
    }

  @ReactMethod
  fun takePhoto(viewTag: Int, options: ReadableMap, promise: Promise) {
    coroutineScope.launch {
      val view = findCameraView(viewTag)
      withPromise(promise) {
        view.takePhoto(options)
      }
    }
  }

  // TODO: startRecording() cannot be awaited, because I can't have a Promise and a onRecordedCallback in the same function. Hopefully TurboModules allows that
  @ReactMethod
  fun startRecording(viewTag: Int, jsOptions: ReadableMap, onRecordCallback: Callback) {
    coroutineScope.launch {
      val view = findCameraView(viewTag)
      try {
        val options = RecordVideoOptions(jsOptions)
        view.startRecording(options, onRecordCallback)
      } catch (error: CameraError) {
        val map = makeErrorMap("${error.domain}/${error.id}", error.message, error)
        onRecordCallback(null, map)
      } catch (error: Throwable) {
        val map =
          makeErrorMap("capture/unknown", "An unknown error occurred while trying to start a video recording! ${error.message}", error)
        onRecordCallback(null, map)
      }
    }
  }

  @ReactMethod
  fun pauseRecording(viewTag: Int, promise: Promise) {
    coroutineScope.launch {
      withPromise(promise) {
        val view = findCameraView(viewTag)
        view.pauseRecording()
        return@withPromise null
      }
    }
  }

  @ReactMethod
  fun resumeRecording(viewTag: Int, promise: Promise) {
    coroutineScope.launch {
      val view = findCameraView(viewTag)
      withPromise(promise) {
        view.resumeRecording()
        return@withPromise null
      }
    }
  }

  @ReactMethod
  fun stopRecording(viewTag: Int, promise: Promise) {
    coroutineScope.launch {
      val view = findCameraView(viewTag)
      withPromise(promise) {
        view.stopRecording()
        return@withPromise null
      }
    }
  }

  @ReactMethod
  fun focus(viewTag: Int, point: ReadableMap, promise: Promise) {
    coroutineScope.launch {
      val view = findCameraView(viewTag)
      withPromise(promise) {
        view.focus(point)
        return@withPromise null
      }
    }
  }

  private fun canRequestPermission(permission: String): Boolean {
    val activity = currentActivity as? PermissionAwareActivity
    return activity?.shouldShowRequestPermissionRationale(permission) ?: false
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getCameraPermissionStatus(): String {
    val status = ContextCompat.checkSelfPermission(reactApplicationContext, Manifest.permission.CAMERA)
    var parsed = PermissionStatus.fromPermissionStatus(status)
    if (parsed == PermissionStatus.DENIED && canRequestPermission(Manifest.permission.CAMERA)) {
      parsed = PermissionStatus.NOT_DETERMINED
    }
    return parsed.unionValue
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getMicrophonePermissionStatus(): String {
    val status = ContextCompat.checkSelfPermission(reactApplicationContext, Manifest.permission.RECORD_AUDIO)
    var parsed = PermissionStatus.fromPermissionStatus(status)
    if (parsed == PermissionStatus.DENIED && canRequestPermission(Manifest.permission.RECORD_AUDIO)) {
      parsed = PermissionStatus.NOT_DETERMINED
    }
    return parsed.unionValue
  }

  @ReactMethod
  fun requestCameraPermission(promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity is PermissionAwareActivity) {
      val currentRequestCode = sharedRequestCode++
      val listener = PermissionListener { requestCode: Int, _: Array<String>, grantResults: IntArray ->
        if (requestCode == currentRequestCode) {
          val permissionStatus = if (grantResults.isNotEmpty()) grantResults[0] else PackageManager.PERMISSION_DENIED
          val parsed = PermissionStatus.fromPermissionStatus(permissionStatus)
          promise.resolve(parsed.unionValue)
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
    val activity = reactApplicationContext.currentActivity
    if (activity is PermissionAwareActivity) {
      val currentRequestCode = sharedRequestCode++
      val listener = PermissionListener { requestCode: Int, _: Array<String>, grantResults: IntArray ->
        if (requestCode == currentRequestCode) {
          val permissionStatus = if (grantResults.isNotEmpty()) grantResults[0] else PackageManager.PERMISSION_DENIED
          val parsed = PermissionStatus.fromPermissionStatus(permissionStatus)
          promise.resolve(parsed.unionValue)
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
