package com.margelo.nitro.camera.session

import androidx.annotation.Keep
import androidx.camera.core.Camera
import com.facebook.proguard.annotations.DoNotStrip
import java.io.Closeable

@Keep
@DoNotStrip
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
