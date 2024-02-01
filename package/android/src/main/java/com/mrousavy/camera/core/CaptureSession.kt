package com.mrousavy.camera.core

import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.os.Build
import android.util.Log
import com.mrousavy.camera.core.outputs.SurfaceOutput
import com.mrousavy.camera.extensions.createCaptureSession
import com.mrousavy.camera.extensions.openCamera
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlin.coroutines.CoroutineContext

/**
 * A wrapper around [CameraDevice] and [CameraCaptureSession] that handles interruptions safely
 * instead of closing the session irrecoverably.
 */
class CaptureSession(
  private val cameraManager: CameraManager,
  private val callback: Callback,
  private val coroutineContext: CoroutineScope
  ) {
  companion object {
    private const val TAG = "CaptureSession"
  }
  // Management
  private val mutex = Mutex(false)

  // Inputs
  private var cameraId: String? = null
  private var outputs: List<SurfaceOutput> = emptyList()
  private var isActive: Boolean = false

  // State that depends on Inputs
  private var device: CameraDevice? = null
  private var session: SessionWithOutputs? = null

  suspend fun beginConfiguration() {
    Log.i(TAG, "Beginning Session Configuration...")
    mutex.lock()
  }

  suspend fun commitConfiguration() {
    Log.i(TAG, "Committing Session Configuration...")
    if (mutex.isLocked) {
      mutex.unlock()
    }
    update()
  }

  private fun assertIsLocked(methodName: String) {
    if (!mutex.isLocked) {
      throw Error("CaptureSession: setIsActive() can only be called within beginConfiguration() and commitConfiguration!")
    }
  }

  fun setIsActive(isActive: Boolean) {
    assertIsLocked("setIsActive")
    this.isActive = isActive
  }

  fun setInput(cameraId: String) {
    assertIsLocked("setInput")
    this.cameraId = cameraId
  }

  fun setOutputs(outputs: List<SurfaceOutput>) {
    assertIsLocked("setOutputs")
    this.outputs = outputs
  }

  private fun tryRecover() {
    if (!this.isActive) {
      // If we don't want CaptureSession to be active right now, we don't need to recover anything.
      return
    }

    Log.i(TAG, "Trying to recover an unexpectedly closed CameraCaptureSession...")
    coroutineContext.launch {
      delay(500)

      if (!this.isActive) {
        // Double-check if isActive is still true, it might've changed in the meantime.
        return@launch
      }
      update()
    }
  }

  private suspend fun getDevice(): CameraDevice? {
    val cameraId = cameraId ?: return null

    val currentDevice = device
    if (currentDevice != null && currentDevice.id == cameraId) {
      return currentDevice
    }

    session?.session?.abortCaptures()
    session = null
    device?.close()
    device = null

    val newDevice = cameraManager.openCamera(cameraId) { device, error ->
      Log.i(TAG, "Camera ${device.id} has been disconnected! Error: ${error?.message ?: "No error."}")
      if (device == this.device) {
        // the currently active device has been closed!
        this.session?.session?.abortCaptures()
        this.session = null
        this.device = null
        tryRecover()
      }
      if (error != null) {
        callback.onError(error)
      }
    }

    device = newDevice

    return newDevice
  }

  private suspend fun getSession(device: CameraDevice): SessionWithOutputs {
    val currentSession = session
    if (currentSession != null && currentSession.outputs == outputs && currentSession.session.device == device) {
      return currentSession
    }

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
      throw Error("capturesession dont work below P")
    }

    val newSession = device.createCaptureSession(cameraManager, outputs, { session ->
      Log.i(TAG, "Session $session has been closed!")
      if (session == this.session?.session) {
        // the currently active session has been closed!
        this.session = null
        tryRecover()
      }
    }, CameraQueues.cameraQueue)

    val newSessionWithOutputs = SessionWithOutputs(newSession, outputs)
    session = newSessionWithOutputs
    return newSessionWithOutputs
  }

  private suspend fun update() {
    mutex.withLock {
      val device = getDevice()
      if (device == null) return

      val session = getSession(device)
      if (!isActive) return

      val preview = outputs.find { it.outputType == SurfaceOutput.OutputType.PREVIEW }
      if (preview == null) return

      val request = device.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW)
      request.addTarget(preview.surface)
      session.session.setRepeatingRequest(request.build(), null, null)
    }
  }


  data class SessionWithOutputs(val session: CameraCaptureSession,
    val outputs: List<SurfaceOutput>)

  interface Callback {
    fun onError(error: Throwable)
  }
}
