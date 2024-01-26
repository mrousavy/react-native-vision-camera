package com.mrousavy.camera.core

import android.annotation.SuppressLint
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.params.SessionConfiguration
import android.os.Build
import com.mrousavy.camera.types.CameraDeviceError

@SuppressLint("MissingPermission")
class CaptureSession(private val cameraManager: CameraManager,
                     private val callback: Callback) {
  // Declarative State describing what we want
  private var isActive = false
  private var cameraId: String? = null

  // Imperative State representing what we currently have in time
  private var device: CameraDevice? = null
  private var session: CameraCaptureSession? = null


  fun setInputDevice(cameraId: String) {
    this.cameraId = cameraId
    configure()
  }

  fun setIsActive(isActive: Boolean) {
    this.isActive = isActive
    configure()
  }

  private fun maybeOpenCamera() {
    val cameraId = cameraId ?: return

    var didCallback = false
    cameraManager.openCamera(cameraId, object: CameraDevice.StateCallback() {
      override fun onOpened(camera: CameraDevice) {
        if (this@CaptureSession.cameraId != cameraId) {
          // a new request has been set, we can drop this one.
          return
        }

        // Camera successfully opened
        didCallback = true
        device = camera
      }

      private fun onDisconnected(camera: CameraDevice, error: CameraDeviceError) {
        if (this@CaptureSession.device != camera) {
          // a new request has been set, we can drop this one.
          return
        }

        if (!didCallback) {
          // we did not yet receive a response from this method, so this means the device failed to open.
          didCallback = true
          callback.onError(CameraCannotBeOpenedError(cameraId, error))
        } else {
          // we did already receive a camera device, so this means the device has been disconnected.
          callback.onInterrupted()
        }
        session?.abortCaptures()
        device = null
      }

      override fun onDisconnected(camera: CameraDevice) = onDisconnected(camera, CameraDeviceError.DISCONNECTED)
      override fun onError(camera: CameraDevice, error: Int) = onDisconnected(camera, CameraDeviceError.fromCameraDeviceError(error))
    }, null)
  }

  private fun maybeOpenSession() {
    val device = device ?: return

    var didCallback = false
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      val config = SessionConfiguration(SessionConfiguration.SESSION_REGULAR, emptyList(), CameraQueues.cameraQueue.executor, object: CameraCaptureSession.StateCallback() {
        override fun onConfigured(session: CameraCaptureSession) {
          TODO("Not yet implemented")
        }

        override fun onConfigureFailed(session: CameraCaptureSession) {
          TODO("Not yet implemented")
        }
      })
      device.createCaptureSession(config)
    }
  }

  private fun configure() {
    val cameraId = this.cameraId ?: return

    val device = this.device
    if (device == null) {
      maybeOpenCamera()
      return
    }

  }


  interface Callback {
    fun onInterrupted()
    fun onError(error: Throwable)
  }
}
