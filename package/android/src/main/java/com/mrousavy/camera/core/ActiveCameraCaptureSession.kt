package com.mrousavy.camera.core

import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraManager
import android.hardware.camera2.params.SessionConfiguration
import android.os.Build
import android.util.Log
import com.mrousavy.camera.core.outputs.SurfaceOutput

class ActiveCameraCaptureSession(private val cameraManager: CameraManager,
                                 private val onError: (error: CameraError) -> Unit,
                                 private val onInterrupted: () -> Unit): CameraCaptureSession.StateCallback() {
  companion object {
    private const val TAG = "ActiveCameraCaptureSession"
  }
  private var session: CameraCaptureSession? = null
  private var device: InterruptibleCameraDevice? = null
  private var outputs: ArrayList<SurfaceOutput> = arrayListOf()

  fun addOutput(output: SurfaceOutput) {
    Log.i(TAG, "Adding output: $output")
    outputs.add(output)
  }

  fun removeOutput(output: SurfaceOutput) {
    Log.i(TAG, "Removing output: $output")
    outputs.remove(output)
  }

  fun clearOutputs() {
    Log.i(TAG, "Clearing outputs...")
    outputs.clear()
  }

  fun createSession() {
    
  }


  fun setInputCameraId(cameraId: String) {
    Log.i(TAG, "Setting Input Camera ID: $cameraId")
    if (device?.cameraId != cameraId) {
      device?.close()
      device = InterruptibleCameraDevice(cameraManager, cameraId, onInterrupted)
      openSession()
    }
  }

  override fun onConfigured(session: CameraCaptureSession) {
    val cameraId = session.device.id
    Log.i(TAG, "Successfully created CameraCaptureSession for Camera $cameraId.")
    this.session = session
  }

  override fun onConfigureFailed(session: CameraCaptureSession) {
    val cameraId = session.device.id
    val error = CameraSessionCannotBeConfiguredError(cameraId)
    Log.e(TAG, "Failed to create CameraCaptureSession for Camera $cameraId!", error)
    onError(error)
  }

  override fun onClosed(session: CameraCaptureSession) {
    val cameraId = session.device.id
    Log.i(TAG, "CameraCaptureSession for Camera $cameraId has been closed.")
    super.onClosed(session)
  }

  private fun openSession() {
    val device = device?.device
    if (device == null) {
      Log.i(TAG, "No Camera Device opened, cannot create session yet.")
      return
    }

    Log.i(TAG, "Creating CameraCaptureSession for Camera ${device.id}...")
    val characteristics = cameraManager.getCameraCharacteristics(device.id)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      val outputs = outputs.map { it.toOutputConfiguration(characteristics) }
      val config = SessionConfiguration(SessionConfiguration.SESSION_REGULAR, outputs, CameraQueues.cameraQueue.executor, this)
      device.createCaptureSession(config)
    } else {
      val outputs = outputs.map { it.surface }
      device.createCaptureSession(outputs, this, CameraQueues.cameraQueue.handler)
    }
  }
}
