package com.mrousavy.camera

import android.os.Handler
import android.os.HandlerThread
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.android.asCoroutineDispatcher
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.asExecutor
import java.util.concurrent.Executor
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.coroutines.CoroutineContext

class CameraQueues {
  companion object {
    val cameraQueue = CameraQueue("mrousavy/VisionCamera.main")
    val videoQueue = CameraQueue("mrousavy/VisionCamera.video")
  }

  class CameraQueue(name: String) {
    val handler: Handler
    val coroutineScope: CoroutineScope
    private val thread: HandlerThread
    val executor: Executor

    init {
      thread = HandlerThread(name)
      thread.start()
      handler = Handler(thread.looper)
      val coroutineDispatcher = handler.asCoroutineDispatcher()
      coroutineScope = CoroutineScope(coroutineDispatcher)
      executor = coroutineDispatcher.asExecutor()
    }

    protected fun finalize() {
      thread.quitSafely()
    }
  }
}

