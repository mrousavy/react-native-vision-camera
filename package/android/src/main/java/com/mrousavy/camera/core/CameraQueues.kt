package com.mrousavy.camera.core

import android.os.Handler
import android.os.HandlerThread
import java.util.concurrent.Executors
import java.util.concurrent.ExecutorService

class CameraQueues {
  companion object {
    val analyzerExecutor: ExecutorService = Executors.newCachedThreadPool()
    val cameraExecutor: ExecutorService = Executors.newCachedThreadPool()
    val videoQueue = CameraQueue("mrousavy/VisionCamera.video")
  }

  class CameraQueue(name: String) {
    val handler: Handler
    private val thread: HandlerThread

    init {
      thread = HandlerThread(name)
      thread.start()
      handler = Handler(thread.looper)
    }

    protected fun finalize() {
      thread.quitSafely()
    }
  }
}
