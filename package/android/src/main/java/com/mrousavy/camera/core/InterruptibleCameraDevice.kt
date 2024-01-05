package com.mrousavy.camera.core

import android.annotation.SuppressLint
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraDevice.TEMPLATE_PREVIEW
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CameraManager.AvailabilityCallback
import android.util.Log
import java.io.Closeable

/**
 * A [CameraDevice] instance that treats Camera disconnects as temporary interruptions and automatically reconnects the device when possible.
 */
class InterruptibleCameraDevice(private val cameraManager: CameraManager, val cameraId: String, private val onInterrupted: () -> Unit) :
  CameraDevice.StateCallback(),
  Closeable {
  companion object {
    private const val TAG = "ActiveCameraDevice"
  }
  var device: CameraDevice? = null
  private val isOpen: Boolean
    get() {
      if (device == null) return false
      return try {
        device?.createCaptureRequest(TEMPLATE_PREVIEW)
        true
      } catch (e: Throwable) {
        false
      }
    }
  private val availabilityCallback = object : AvailabilityCallback() {
    override fun onCameraAvailable(cameraId: String) {
      super.onCameraAvailable(cameraId)
      if (cameraId == this@InterruptibleCameraDevice.cameraId) {
        Log.i(TAG, "Camera $cameraId: Available again! Opening...")
        openCamera()
      }
    }
  }

  init {
    cameraManager.registerAvailabilityCallback(availabilityCallback, CameraQueues.cameraQueue.handler)
    openCamera()
  }

  override fun onOpened(camera: CameraDevice) {
    Log.i(TAG, "Camera $cameraId: Opened!")
    device = camera
  }

  override fun onDisconnected(camera: CameraDevice) {
    Log.i(TAG, "Camera $cameraId: Disconnected!")
    if (device == camera) {
      device = null
      onInterrupted()
    }
    camera.close()
  }

  override fun onError(camera: CameraDevice, error: Int) {
    Log.e(TAG, "Camera $cameraId: Error! $error")
    if (device == camera) {
      device = null
      onInterrupted()
    }
    camera.close()
  }

  @SuppressLint("MissingPermission")
  fun openCamera() {
    if (isOpen) {
      Log.i(TAG, "Camera $cameraId: Already opened, skipping...")
      return
    }

    Log.i(TAG, "Camera $cameraId: Opening...")
    device?.close()
    device = null
    cameraManager.openCamera(cameraId, this, CameraQueues.cameraQueue.handler)
  }

  override fun close() {
    cameraManager.unregisterAvailabilityCallback(availabilityCallback)
    device?.close()
    device = null
  }
}
