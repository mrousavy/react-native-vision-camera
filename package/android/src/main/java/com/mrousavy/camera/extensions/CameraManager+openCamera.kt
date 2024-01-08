package com.mrousavy.camera.extensions

import android.annotation.SuppressLint
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.os.Build
import android.util.Log
import com.mrousavy.camera.core.CameraCannotBeOpenedError
import com.mrousavy.camera.core.CameraDisconnectedError
import com.mrousavy.camera.core.CameraQueues
import com.mrousavy.camera.types.CameraDeviceError
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.suspendCancellableCoroutine

private const val TAG = "CameraManager"

@SuppressLint("MissingPermission")
suspend fun CameraManager.openCamera(
  cameraId: String,
  onDisconnected: (camera: CameraDevice, error: Throwable?) -> Unit,
  queue: CameraQueues.CameraQueue
): CameraDevice =
  suspendCancellableCoroutine { continuation ->
    Log.i(TAG, "Camera #$cameraId: Opening...")

    val callback = object : CameraDevice.StateCallback() {
      override fun onOpened(camera: CameraDevice) {
        Log.i(TAG, "Camera #$cameraId: Opened!")
        continuation.resume(camera)
      }

      override fun onDisconnected(camera: CameraDevice) {
        Log.i(TAG, "Camera #$cameraId: Disconnected!")
        if (continuation.isActive) {
          continuation.resumeWithException(CameraCannotBeOpenedError(cameraId, CameraDeviceError.DISCONNECTED))
        } else {
          onDisconnected(camera, null)
        }
        camera.close()
      }

      override fun onError(camera: CameraDevice, errorCode: Int) {
        Log.e(TAG, "Camera #$cameraId: Error! $errorCode")
        val error = CameraDeviceError.fromCameraDeviceError(errorCode)
        if (continuation.isActive) {
          continuation.resumeWithException(CameraCannotBeOpenedError(cameraId, error))
        } else {
          onDisconnected(camera, CameraDisconnectedError(cameraId, error))
        }
        camera.close()
      }
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      this.openCamera(cameraId, queue.executor, callback)
    } else {
      this.openCamera(cameraId, callback, queue.handler)
    }
  }
