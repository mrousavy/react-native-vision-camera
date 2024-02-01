package com.mrousavy.camera.core

import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.TotalCaptureResult
import android.util.Log
import com.mrousavy.camera.core.outputs.SurfaceOutput
import com.mrousavy.camera.extensions.capture
import com.mrousavy.camera.extensions.createCaptureSession
import com.mrousavy.camera.extensions.openCamera
import java.io.Closeable

/**
 * A [CameraCaptureSession] wrapper that safely handles interruptions and remains open whenever available.
 */
class PersistentCameraCaptureSession(private val cameraManager: CameraManager): Closeable {
  companion object {
    private const val TAG = "PersistentCameraCaptureSession"
  }
  // Inputs/Dependencies
  private var repeatingRequest: RepeatingRequest? = null
  private var surfaceOutputs: List<SurfaceOutput> = emptyList()
  private var cameraId: String? = null
  private var isActive = false

  // State/Dependants
  private var session: CameraCaptureSession? = null
  private var device: CameraDevice? = null
  private var cameraDeviceDetails: CameraDeviceDetails? = null
    get() {
      val device = device ?: return null
      if (field == null || field?.cameraId != device.id) {
        field = CameraDeviceDetails(cameraManager, device.id)
      }
      return field
    }

  val outputs: List<SurfaceOutput>
    get() = surfaceOutputs

  private suspend fun createDevice(cameraId: String): CameraDevice {
    return cameraManager.openCamera(cameraId, { device, error ->
      if (this.device == device) {
        this.device = null
      }
      if (error != null) {
        Log.e(TAG, "Camera #$cameraId has been disconnected!", error)
      }
    }, CameraQueues.cameraQueue)
  }

  private suspend fun createSession(device: CameraDevice, outputs: List<SurfaceOutput>): CameraCaptureSession {
    if (outputs.isEmpty()) {
      throw Error("Cannot configure PersistentCameraCaptureSession without outputs!")
    }

    return device.createCaptureSession(cameraManager, outputs, { session ->
       if (this.session == session) {
         this.session = null
       }
    }, CameraQueues.cameraQueue)
  }

  private fun updateRepeatingRequest() {
    val request = repeatingRequest ?: return
    val session = session ?: return
    val device = device ?: return
    val cameraDeviceDetails = cameraDeviceDetails ?: return
    if (!isActive) {
      return
    }

    val repeatingRequest = request.toRepeatingRequest(device, cameraDeviceDetails, outputs)
    session.setRepeatingRequest(repeatingRequest, null, null)
  }

  suspend fun setInput(cameraId: String) {
    if (this.cameraId != cameraId) {
      // Set target input values
      this.cameraId = cameraId

      if (device?.id != cameraId) {
        // Close everything that depends on that device
        session?.abortCaptures()
        session = null
        device?.close() // <-- this will close the session as well

        // Create a new device
        device = createDevice(cameraId)
      }
    }
  }

  suspend fun setOutputs(outputs: List<SurfaceOutput>) {
    if (this.surfaceOutputs != outputs) {
      // Set target input values
      this.surfaceOutputs = outputs

      if (outputs.isNotEmpty()) {
        // Update output session
        val device = device ?: return
        session?.abortCaptures()
        session = null
        session = createSession(device, outputs)
        updateRepeatingRequest()
      } else {
        // Just stop it, we don't have any outputs
        session?.close()
        session = null
      }
    }
  }

  fun startRepeating(request: RepeatingRequest) {
    if (this.repeatingRequest != request) {
      this.repeatingRequest = request
      this.isActive = true
      updateRepeatingRequest()
    }
  }

  fun stopRepeating() {
    this.isActive = false
    session?.stopRepeating()
  }

  suspend fun capture(request: CaptureRequest, enableShutterSound: Boolean): TotalCaptureResult {
    val session = session ?: throw CameraNotReadyError()
    return session.capture(request, enableShutterSound)
  }

  override fun close() {
    session?.abortCaptures()
    device?.close()
  }
}
