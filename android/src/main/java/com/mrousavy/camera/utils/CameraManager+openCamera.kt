package com.mrousavy.camera.utils

import android.annotation.SuppressLint
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.util.Log
import com.mrousavy.camera.CameraCannotBeOpenedError
import com.mrousavy.camera.CameraDisconnectedError
import com.mrousavy.camera.CameraQueues
import com.mrousavy.camera.CameraView
import com.mrousavy.camera.parsers.parseCameraError
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

@SuppressLint("MissingPermission")
suspend fun CameraManager.openCamera(cameraId: String, onClosed: () -> Unit): CameraDevice {
  return suspendCoroutine { continuation ->
    var didRun = false
    Log.i(CameraView.TAG, "Opening Camera $cameraId...")


    this.openCamera(cameraId, object: CameraDevice.StateCallback() {
      override fun onOpened(device: CameraDevice) {
        Log.i(CameraView.TAG, "Successfully opened Camera Device $cameraId!")
        if (!didRun) {
          continuation.resume(device)
          didRun = true
        }
      }

      override fun onDisconnected(camera: CameraDevice) {
        Log.w(CameraView.TAG, "Camera Device $cameraId has been disconnected! Closing Camera..")
        if (!didRun) {
          continuation.resumeWithException(CameraDisconnectedError(cameraId))
          didRun = true
        } else {
          onClosed()
        }
      }

      override fun onError(camera: CameraDevice, errorCode: Int) {
        Log.e(CameraView.TAG, "Failed to open Camera Device $cameraId! Closing Camera.. Error: $errorCode (${parseCameraError(errorCode)})")
        if (!didRun) {
          continuation.resumeWithException(CameraCannotBeOpenedError(cameraId, parseCameraError(errorCode)))
          didRun = true
        } else {
          onClosed()
        }
      }
    }, CameraQueues.cameraQueue.handler)
  }
}
