package com.mrousavy.camera.core.extensions

import com.google.common.util.concurrent.ListenableFuture
import java.util.concurrent.ExecutionException
import java.util.concurrent.Executor
import kotlin.coroutines.cancellation.CancellationException
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.asExecutor
import kotlinx.coroutines.isActive

suspend fun <V> ListenableFuture<V>.await(executor: Executor? = null): V {
  if (this.isCancelled) throw CancellationException("ListenableFuture<V> has been canceled!")
  if (this.isDone) return this.get()

  return suspendCoroutine { continuation ->
    this.addListener({
      if (this.isCancelled || !continuation.context.isActive) throw CancellationException("ListenableFuture<V> has been canceled!")
      try {
        continuation.resume(this.get())
      } catch (e: ExecutionException) {
        val cause = e.cause
        if (cause != null) {
          continuation.resumeWithException(cause)
        } else {
          throw e
        }
      }
    }, executor ?: Dispatchers.Main.asExecutor())
  }
}
