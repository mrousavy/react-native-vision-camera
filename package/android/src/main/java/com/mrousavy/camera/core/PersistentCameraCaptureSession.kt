package com.mrousavy.camera.core

import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.TotalCaptureResult
import android.util.Log
import androidx.lifecycle.MutableLiveData
import com.mrousavy.camera.core.outputs.SurfaceOutput
import com.mrousavy.camera.extensions.capture
import com.mrousavy.camera.extensions.createCaptureSession
import com.mrousavy.camera.extensions.openCamera
import com.mrousavy.camera.extensions.tryAbortCaptures
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import java.io.Closeable
import java.util.concurrent.CancellationException
import kotlin.coroutines.CoroutineContext

/**
 * A [CameraCaptureSession] wrapper that safely handles interruptions and remains open whenever available.
 *
 * It uses Kotlin coroutines and Flow to connect async dependencies.
 */
class PersistentCameraCaptureSession(private val cameraManager: CameraManager,
                                     private val callback: Callback,
                                     private val coroutineContext: CoroutineContext) : Closeable {
  companion object {
    private var counter = 1
  }
  private val TAG = "PersistentCameraCaptureSession${counter++}"

  private val coroutineScope = CoroutineScope(coroutineContext)

  // State
  private var isActive = MutableStateFlow(false)
  private var repeatingRequest = MutableStateFlow<RepeatingRequest?>(null)

  // Inputs/Dependencies
  private var cameraId = MutableStateFlow<String?>(null)
  private var outputs = MutableStateFlow(emptyList<SurfaceOutput>())

  init {
    coroutineScope.launch {
      val deviceFlow = cameraId.filterNotNull().map { createDevice(it) }
      val sessionFlow = combine(deviceFlow, outputs) { device, outputs -> createSession(device, outputs) }
      sessionFlow.collect { session ->
      }
    }

    coroutineScope.launch {
      flowingCameraId.collect { newValue ->
        cameraId = newValue
      }
      flowingOutputs.collect { newValue ->
        outputs = newValue
      }
      flowingDeviceDetails.collect { newValue ->
        cameraDeviceDetails = newValue
      }
      flowingDevice.collect { newValue ->
        if (device != newValue) {
          session?.abortCaptures()
          device?.close()
          device = newValue
        }
      }
      flowingSession.collect { newValue ->
        if (session != newValue) {
          session?.abortCaptures()
          session = newValue
          updateRepeatingRequest()
        }
      }
      flowingTrigger.collect { newValue ->
        Log.i(TAG, "Flowing Trigger DID change")
      }
    }
  }

  private fun createRepeatingRequest(request: RepeatingRequest, device: CameraDevice?, deviceDetails: CameraDeviceDetails, outputs: List<SurfaceOutput>): CaptureRequest? {
    if (device == null) return null
    return request.toRepeatingRequest(device, deviceDetails, outputs)
  }

  private suspend fun createDevice(cameraId: String): CameraDevice =
    cameraManager.openCamera(cameraId, { device, error ->
      if (this.device == device) {
        this.session?.tryAbortCaptures()
        this.session = null
        this.device = null
        this.isActive = false
      }
      if (error != null) {
        callback.onError(error)
      }
    }, CameraQueues.cameraQueue)

  private suspend fun createSession(device: CameraDevice?, outputs: List<SurfaceOutput>): CameraCaptureSession? {
    if (device == null) {
      return null
    }
    if (outputs.isEmpty()) {
      return null
    }
    return device.createCaptureSession(cameraManager, outputs, { session ->
      if (this.session == session) {
        this.session?.tryAbortCaptures()
        this.session = null
        this.isActive = false
      }
    }, CameraQueues.cameraQueue)
  }

  private fun updateRepeatingRequest() {
    val session = session ?: return
    if (isActive) {
      val request = repeatingRequest ?: return
      val device = device ?: return
      val cameraDeviceDetails = cameraDeviceDetails ?: return

      val repeatingRequest = request.toRepeatingRequest(device, cameraDeviceDetails, outputs)
      session.setRepeatingRequest(repeatingRequest, null, null)
    } else {
      session.stopRepeating()
    }
  }

  suspend fun setInput(cameraId: String) {
    flowingCameraId = flowOf(cameraId)
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

  fun setRepeatingRequest(request: RepeatingRequest) {
    if (this.repeatingRequest != request) {
      this.repeatingRequest = request
      updateRepeatingRequest()
    }
  }

  fun setIsActive(isActive: Boolean) {
    if (this.isActive != isActive) {
      this.isActive = isActive
      updateRepeatingRequest()
    }
  }

  suspend fun capture(request: CaptureRequest, enableShutterSound: Boolean): TotalCaptureResult {
    val session = session ?: throw CameraNotReadyError()
    return session.capture(request, enableShutterSound)
  }

  override fun close() {
    coroutineContext.cancel(CancellationException("Session is torn down."))
    session?.abortCaptures()
    device?.close()
  }

  interface Callback {
    fun onError(error: Throwable)
  }
}
