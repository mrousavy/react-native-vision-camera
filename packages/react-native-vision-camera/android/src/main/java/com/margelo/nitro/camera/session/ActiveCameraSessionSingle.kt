package com.margelo.nitro.camera.session

import android.util.Log
import androidx.camera.camera2.adapter.CameraInfoAdapter.Companion.cameraId
import androidx.camera.core.Camera
import androidx.camera.core.CameraState
import androidx.lifecycle.Observer
import com.margelo.nitro.camera.extensions.reason
import java.io.Closeable

class ActiveCameraSessionSingle(
  private val camera: Camera,
  private val listener: ActiveCameraSession.LifecycleListener,
) : ActiveCameraSession,
  Closeable {
  companion object {
    private val TAG = ActiveCameraSessionSingle::class.java.simpleName
  }

  override var isRunning: Boolean
  override val cameras: List<Camera> = listOf(camera)

  private var currentError: CameraState.StateError? = null

  private val observer = Observer<CameraState> { updateCameraState() }

  init {
    isRunning = camera.cameraInfo.cameraState.value
      ?.type == CameraState.Type.OPEN
    // Add listeners to the Camera
    camera.cameraInfo.cameraState.observeForever(observer)
  }

  override fun close() {
    camera.cameraInfo.cameraState.removeObserver(observer)
  }

  private fun updateCameraState() {
    val state = camera.cameraInfo.cameraState.value
    Log.i(TAG, "Camera #${camera.cameraInfo.cameraId} State changed! Type: ${state?.type} | Error: ${state?.error}")
    val isNowRunning = state?.type == CameraState.Type.OPEN
    if (isRunning != isNowRunning) {
      // isRunning state changed!
      if (!isRunning && isNowRunning) {
        listener.onStarted()
      } else if (isRunning && !isNowRunning) {
        listener.onStopped()
      }
      isRunning = isNowRunning
    }

    val error = state?.error
    if (currentError != error) {
      // error state changed!
      if (error != null) {
        // We encountered an error!
        val throwable = Error(error.reason, error.cause)
        listener.onError(throwable)

        // If it's a recoverable error, we can treat it like an interruption
        if (error.type == CameraState.ErrorType.RECOVERABLE) {
          listener.onInterruptionStarted()
        }
      } else {
        // Error encounter is now over!
        if (currentError?.type == CameraState.ErrorType.RECOVERABLE) {
          // it was a recoverable error that is now over! the interruption ended
          listener.onInterruptionEnded()
        }
      }
      currentError = error
    }
  }
}
