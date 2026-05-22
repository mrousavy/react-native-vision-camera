package com.margelo.nitro.camera.extensions

import com.google.common.util.concurrent.ListenableFuture
import kotlinx.coroutines.suspendCancellableCoroutine
import java.util.concurrent.ExecutionException
import java.util.concurrent.Executor
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

private val directExecutor = Executor { runnable -> runnable.run() }

suspend fun <T> ListenableFuture<T>.await(): T {
  if (isDone) {
    return getCompleted()
  }

  return suspendCancellableCoroutine { continuation ->
    addListener(
      {
        if (continuation.isActive) {
          try {
            continuation.resume(getCompleted())
          } catch (error: Throwable) {
            continuation.resumeWithException(error)
          }
        }
      },
      directExecutor,
    )

    continuation.invokeOnCancellation {
      cancel(true)
    }
  }
}

private fun <T> ListenableFuture<T>.getCompleted(): T {
  return try {
    get()
  } catch (error: ExecutionException) {
    throw error.cause ?: error
  }
}
