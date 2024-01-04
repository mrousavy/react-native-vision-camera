package com.mrousavy.camera.core

import android.annotation.SuppressLint
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraDevice.TEMPLATE_PREVIEW
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CameraManager.AvailabilityCallback
import android.util.Log
import java.io.Closeable

/**
 * A [CameraDevice] instance that treats Camera disconnects as temporary interruptions.
 */
class ActiveCameraDevice(private val cameraManager: CameraManager,
                         private val cameraId: String): AvailabilityCallback(), Closeable {
  companion object {
    private const val TAG = "ActiveCameraDevice"
  }
  private var device: CameraDevice? = null
  var isActive = false
    set(value) {
      field = value
      if (value) openCamera()
    }
  private val isOpen: Boolean
    get() {
      return try {
        device?.createCaptureRequest(TEMPLATE_PREVIEW)
        true
      } catch (e: Throwable) {
        false
      }
    }

  init {
    cameraManager.registerAvailabilityCallback(this, null)
    openCamera()
  }

  @SuppressLint("MissingPermission")
  fun openCamera() {
    val currentCamera = device
    if (isOpen) {
      Log.i(TAG, "Camera $cameraId: Already opened, skipping...")
      return
    }

    cameraManager.openCamera(cameraId, object: CameraDevice.StateCallback() {
      override fun onOpened(camera: CameraDevice) {
        Log.i(TAG, "Camera $cameraId: Opened!")
        device = camera
        currentCamera?.close()
      }

      override fun onDisconnected(camera: CameraDevice) {
        Log.i(TAG, "Camera $cameraId: Disconnected!")
        if (device == camera) device = null
        camera.close()
      }

      override fun onError(camera: CameraDevice, error: Int) {
        Log.e(TAG, "Camera $cameraId: Error! $error")
        if (device == camera) device = null
        camera.close()
      }
    }, null)
  }

  override fun onCameraAvailable(cameraId: String) {
    super.onCameraAvailable(cameraId)
    if (cameraId == this.cameraId && isActive) {
      Log.i(TAG, "Camera $cameraId: Available again! Opening...")
      openCamera()
    }
  }

  override fun close() {
    cameraManager.unregisterAvailabilityCallback(this)
    device?.close()
    device = null
  }
}
