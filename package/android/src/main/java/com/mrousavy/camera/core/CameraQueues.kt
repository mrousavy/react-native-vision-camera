package com.mrousavy.camera.core

import android.os.Handler
import android.os.HandlerThread
import java.util.concurrent.Executor
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.android.asCoroutineDispatcher
import kotlinx.coroutines.asExecutor

class CameraQueues {
  companion object {
    val analyzerExecutor: ExecutorService = Executors.newCachedThreadPool()
    val cameraExecutor: ExecutorService = Executors.newCachedThreadPool()
    val videoQueue = CameraQueue("mrousavy/VisionCamera.video")
  }

  class CameraQueue(name: String) {
    private val thread: HandlerThread
    val handler: Handler
    private val coroutineDispatcher: CoroutineDispatcher
    val executor: Executor

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
