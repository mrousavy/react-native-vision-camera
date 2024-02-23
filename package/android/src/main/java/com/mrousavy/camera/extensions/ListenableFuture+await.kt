package com.mrousavy.camera.extensions

import com.google.common.util.concurrent.ListenableFuture
import com.mrousavy.camera.core.CameraQueues
import kotlinx.coroutines.isActive
import kotlin.coroutines.cancellation.CancellationException
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

suspend fun<V> ListenableFuture<V>.await(): V {
  if (this.isCancelled) throw CancellationException("ListenableFuture<V> has been canceled!")
  if (this.isDone) return this.get()

  return suspendCoroutine { continuation ->
    this.addListener({
      if (this.isCancelled || !continuation.context.isActive) throw CancellationException("ListenableFuture<V> has been canceled!")
      continuation.resume(this.get())
    }, CameraQueues.cameraQueue.executor)
  }
}
