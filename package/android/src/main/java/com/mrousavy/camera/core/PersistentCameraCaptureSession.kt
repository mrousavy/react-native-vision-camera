package com.mrousavy.camera.core

import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.TotalCaptureResult
import com.mrousavy.camera.core.outputs.SurfaceOutput
import com.mrousavy.camera.extensions.capture
import com.mrousavy.camera.extensions.createCaptureSession
import java.io.Closeable

/**
 * A [CameraCaptureSession] wrapper that safely handles interruptions and remains open whenever available.
 */
class PersistentCameraCaptureSession(private val cameraManager: CameraManager,
                                     private val device: CameraDevice): Closeable {
  private var session: CameraCaptureSession? = null
  private var repeatingRequest: RepeatingRequest? = null
  private var outputs: List<SurfaceOutput> = emptyList()

  private val cameraDeviceDetails = CameraDeviceDetails(cameraManager, device.id)

  private suspend fun createSession(outputs: List<SurfaceOutput>): CameraCaptureSession {
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

    val repeatingRequest = request.toRepeatingRequest(device, cameraDeviceDetails)
    session.setRepeatingRequest(repeatingRequest, null, null)
  }

  suspend fun setOutputs(outputs: List<SurfaceOutput>) {
    if (outputs != this.outputs && outputs.isNotEmpty()) {
      val session = createSession(outputs)
      this.session = session
      this.outputs = outputs
      updateRepeatingRequest()
    }
  }

  fun startRepeating(request: RepeatingRequest) {
    if (request != this.repeatingRequest) {
      this.repeatingRequest = request
      updateRepeatingRequest()
    }
  }

  fun stopRepeating() {
    session?.stopRepeating()
  }

  suspend fun capture(request: CaptureRequest, enableShutterSound: Boolean): TotalCaptureResult {
    val session = session ?: throw CameraNotReadyError()
    return session.capture(request, enableShutterSound)
  }

  fun abortCaptures() {
    session?.abortCaptures()
  }

  override fun close() {
    session?.close()
  }
}
