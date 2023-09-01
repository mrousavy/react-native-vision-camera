package com.mrousavy.camera

import android.os.Handler
import android.os.HandlerThread
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.android.asCoroutineDispatcher
import kotlinx.coroutines.asExecutor
import java.util.concurrent.Executor

class CameraQueues {
  companion object {
    val cameraQueue = CameraQueue("mrousavy/VisionCamera.main")
    val videoQueue = CameraQueue("mrousavy/VisionCamera.video")
  }

  class CameraQueue(name: String) {
    val handler: Handler
    private val thread: HandlerThread
    val executor: Executor
    val coroutineDispatcher: CoroutineDispatcher

    init {
      thread = HandlerThread(name)
      thread.start()
      handler = Handler(thread.looper)
      coroutineDispatcher = handler.asCoroutineDispatcher(name)
      executor = coroutineDispatcher.asExecutor()
    }

    protected fun finalize() {
      thread.quitSafely()
    }
  }
}

