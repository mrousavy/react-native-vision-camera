package com.mrousavy.camera.hooks

import android.annotation.SuppressLint
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.util.Log
import com.mrousavy.camera.CameraQueues
import com.mrousavy.camera.CameraView
import com.mrousavy.camera.parsers.parseCameraError
import java.io.Closeable

class UseCameraDevice(private val cameraManager: CameraManager,
                      val cameraId: String,
                      onChange: (device: CameraDevice?) -> Unit): Closeable, DataProvider<CameraDevice>(onChange) {

  private var isOpening = false
  private val availabilityCallback = object: CameraManager.AvailabilityCallback() {
    override fun onCameraAvailable(id: String) {
      super.onCameraAvailable(id)
      if (id == cameraId) {
        // Our camera is available, try to open it
        openCamera()
      }
    }

    override fun onCameraUnavailable(id: String) {
      super.onCameraUnavailable(id)
      if (id == cameraId) {
        // Our camera is no longer available
        update(null)
      }
    }
  }
  private val openCameraCallback = object: CameraDevice.StateCallback() {
    override fun onOpened(camera: CameraDevice) {
      isOpening = false
      Log.i(CameraView.TAG, "Successfully opened Camera Device $cameraId!")
      update(camera)
    }

    override fun onDisconnected(camera: CameraDevice) {
      isOpening = false
      Log.w(CameraView.TAG, "Camera Device $cameraId has been disconnected! Closing Camera..")
      camera.close()
      update(null)
    }

    override fun onError(camera: CameraDevice, errorCode: Int) {
      isOpening = false
      Log.e(CameraView.TAG, "Failed to open Camera Device $cameraId! Closing Camera.. " +
        "Error: $errorCode (${parseCameraError(errorCode)})")
      camera.close()
      update(null)
    }
  }

  init {
    cameraManager.registerAvailabilityCallback(availabilityCallback, CameraQueues.cameraQueue.handler)
  }

  @SuppressLint("MissingPermission")
  fun openCamera() {
    if (isOpening || currentValue?.id == cameraId) {
      // camera is already opened, no need to re-open.
      return
    }
    isOpening = true
    cameraManager.openCamera(cameraId, openCameraCallback, CameraQueues.cameraQueue.handler)
  }

  override fun close() {
    cameraManager.unregisterAvailabilityCallback(availabilityCallback)
  }
}
