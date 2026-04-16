package com.margelo.nitro.camera.session

import androidx.camera.core.Camera
import java.io.Closeable

interface ActiveCameraSession : Closeable {
  interface LifecycleListener {
    fun onStarted()

    fun onStopped()

    fun onError(error: Throwable)

    fun onInterruptionStarted()

    fun onInterruptionEnded()
  }

  val isRunning: Boolean
  val cameras: List<Camera>
}
