package com.mrousavy.camera.extensions

import com.google.common.util.concurrent.ListenableFuture
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.asExecutor
import kotlin.coroutines.cancellation.CancellationException
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine
import kotlinx.coroutines.isActive
import java.util.concurrent.Executor

suspend fun <V> ListenableFuture<V>.await(executor: Executor? = null): V {
  if (this.isCancelled) throw CancellationException("ListenableFuture<V> has been canceled!")
  if (this.isDone) return this.get()

  return suspendCoroutine { continuation ->
    this.addListener({
      if (this.isCancelled || !continuation.context.isActive) throw CancellationException("ListenableFuture<V> has been canceled!")
      continuation.resume(this.get())
    }, executor ?: Dispatchers.Main.asExecutor())
  }
}
