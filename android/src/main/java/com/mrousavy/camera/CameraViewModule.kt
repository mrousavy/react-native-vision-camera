package com.mrousavy.camera

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.ImageReader
import android.media.MediaRecorder
import android.os.Build
import android.util.Log
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.extensions.ExtensionsManager
import androidx.camera.extensions.HdrImageCaptureExtender
import androidx.camera.extensions.NightImageCaptureExtender
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import com.mrousavy.camera.parsers.*
import com.mrousavy.camera.utils.*
import kotlinx.coroutines.*
import kotlinx.coroutines.guava.await

class CameraViewModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    const val REACT_CLASS = "CameraView"
    var RequestCode = 10

    fun parsePermissionStatus(status: Int): String {
      return when (status) {
        PackageManager.PERMISSION_DENIED -> "denied"
        PackageManager.PERMISSION_GRANTED -> "authorized"
        else -> "not-determined"
      }
    }
  }

  override fun getName(): String {
    return REACT_CLASS
  }

  private fun findCameraView(id: Int): CameraView = reactApplicationContext.currentActivity?.findViewById(id) ?: throw ViewNotFoundError(id)

  @ReactMethod
  fun takePhoto(viewTag: Int, options: ReadableMap, promise: Promise) {
    GlobalScope.launch(Dispatchers.Main) {
      withPromise(promise) {
        val view = findCameraView(viewTag)
        view.takePhoto(options)
      }
    }
  }

  @ReactMethod
  fun takeSnapshot(viewTag: Int, options: ReadableMap, promise: Promise) {
    GlobalScope.launch(Dispatchers.Main) {
      withPromise(promise) {
        val view = findCameraView(viewTag)
        view.takeSnapshot(options)
      }
    }
  }

  // TODO: startRecording() cannot be awaited, because I can't have a Promise and a onRecordedCallback in the same function. Hopefully TurboModules allows that
  @ReactMethod(isBlockingSynchronousMethod = true)
  fun startRecording(viewTag: Int, options: ReadableMap, onRecordCallback: Callback) {
    GlobalScope.launch(Dispatchers.Main) {
      val view = findCameraView(viewTag)
      view.startRecording(options, onRecordCallback)
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
    GlobalScope.launch(Dispatchers.Main) {
      withPromise(promise) {
        val view = findCameraView(viewTag)
        view.focus(point)
        return@withPromise null
      }
    }
  }

  @ReactMethod
  fun getAvailableVideoCodecs(viewTag: Int, promise: Promise) {
    withPromise(promise) {
      val view = findCameraView(viewTag)
      view.getAvailableVideoCodecs()
    }
  }

  @ReactMethod
  fun getAvailablePhotoCodecs(viewTag: Int, promise: Promise) {
    withPromise(promise) {
      val view = findCameraView(viewTag)
      view.getAvailablePhotoCodecs()
    }
  }

  // TODO: This uses the Camera2 API to list all characteristics of a camera device and therefore doesn't work with Camera1. Find a way to use CameraX for this
  // https://issuetracker.google.com/issues/179925896
  @ReactMethod
  fun getAvailableCameraDevices(promise: Promise) {
    val startTime = System.currentTimeMillis()
    GlobalScope.launch(Dispatchers.Main) {
      withPromise(promise) {
        // I need to init those because the HDR/Night Mode Extension expects them to be initialized
        val extensionsManager = ExtensionsManager.init(reactApplicationContext).await()
        val processCameraProvider = ProcessCameraProvider.getInstance(reactApplicationContext).await()

        val manager = reactApplicationContext.getSystemService(Context.CAMERA_SERVICE) as? CameraManager
          ?: throw CameraManagerUnavailableError()

        val cameraDevices: WritableArray = Arguments.createArray()

        manager.cameraIdList.forEach loop@{ id ->
          val device = parseCameraDeviceId(id, manager)
          if (device != null) {
            cameraDevices.pushMap(device)
          }
        }

        val difference = System.currentTimeMillis() - startTime
        Log.w(REACT_CLASS, "CameraViewModule::getAvailableCameraDevices took: $difference ms")
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
    val activity = reactApplicationContext.currentActivity
    if (activity is PermissionAwareActivity) {
      val currentRequestCode = RequestCode
      RequestCode++
      val listener = PermissionListener { requestCode: Int, _: Array<String>, grantResults: IntArray ->
        if (requestCode == currentRequestCode) {
          val permissionStatus = grantResults[0]
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
    val activity = reactApplicationContext.currentActivity
    if (activity is PermissionAwareActivity) {
      val currentRequestCode = RequestCode
      RequestCode++
      val listener = PermissionListener { requestCode: Int, _: Array<String>, grantResults: IntArray ->
        if (requestCode == currentRequestCode) {
          val permissionStatus = grantResults[0]
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
