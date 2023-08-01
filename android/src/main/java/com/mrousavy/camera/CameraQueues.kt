package com.mrousavy.camera

import android.os.Handler
import android.os.HandlerThread
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.asCoroutineDispatcher
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.coroutines.CoroutineContext

class CameraQueues {
  companion object {
    val cameraQueue = CameraQueue("mrousavy/VisionCamera.main")
    val videoQueue = CameraQueue("mrousavy/VisionCamera.video")
  }

  class CameraQueue(name: String) {
    val executor: ExecutorService
    val handler: Handler
    val coroutineScope: CoroutineScope
    private val thread: HandlerThread

    init {
      thread = HandlerThread(name)
      thread.start()
      handler = Handler(thread.looper)
      executor = Executors.newSingleThreadExecutor()
      coroutineScope = CoroutineScope(executor.asCoroutineDispatcher())
    }

    protected fun finalize() {
      thread.quitSafely()
    }
  }
}

