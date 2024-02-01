package com.mrousavy.camera.core

import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.TotalCaptureResult
import android.util.Log
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import androidx.lifecycle.MutableLiveData
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.mrousavy.camera.core.outputs.SurfaceOutput
import com.mrousavy.camera.extensions.capture
import com.mrousavy.camera.extensions.createCaptureSession
import com.mrousavy.camera.extensions.openCamera
import com.mrousavy.camera.extensions.tryAbortCaptures
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.flowOf
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
                                     private val coroutineContext: CoroutineContext) : Closeable, LifecycleOwner {
  companion object {
    private var counter = 1
  }
  private val TAG = "PersistentCameraCaptureSession${counter++}"

  private val coroutineScope = CoroutineScope(coroutineContext)
  private val lifecycleRegistry = LifecycleRegistry(this)

  // State
  private var isActive = MutableLiveData(false)
  private var repeatingRequest = MutableLiveData<RepeatingRequest?>(null)

  // Inputs/Dependencies
  private var cameraId = MutableLiveData<String?>(null)
  private var outputs = MutableLiveData(emptyList<SurfaceOutput>())

  init {
    lifecycleRegistry.currentState = Lifecycle.State.RESUMED

    isActive.observe(this) {
      Log.i(TAG, "isActive changed!")
    }
    repeatingRequest.observe(this) {
      Log.i(TAG, "repeatingRequest changed!")
    }
    cameraId.observe(this) {
      Log.i(TAG, "cameraId changed!")
    }
    outputs.observe(this) {
      Log.i(TAG, "outputs changed!")
    }
  }

  override fun close() {
    lifecycleRegistry.currentState = Lifecycle.State.DESTROYED
    coroutineContext.cancel(CancellationException("Session is torn down."))
  }

  override fun getLifecycle(): Lifecycle = lifecycleRegistry

  suspend fun setInput(cameraId: String) {
    this.cameraId.value = cameraId
  }

  suspend fun setOutputs(outputs: List<SurfaceOutput>) {
    this.outputs.value = outputs
  }

  fun setRepeatingRequest(request: RepeatingRequest) {
    this.repeatingRequest.value = request
  }

  fun setIsActive(isActive: Boolean) {
    this.isActive.value = isActive
  }

  suspend fun capture(request: CaptureRequest, enableShutterSound: Boolean): TotalCaptureResult {
    throw NotImplementedError()
  }

  interface Callback {
    fun onError(error: Throwable)
  }
}
