package com.margelo.nitro.camera.extensions

import com.google.common.util.concurrent.ListenableFuture
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeout
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

suspend fun <T> ListenableFuture<T>.await(
  timeoutMs: Long,
  operationName: String,
): T {
  return try {
    withTimeout(timeoutMs) {
      await()
    }
  } catch (error: TimeoutCancellationException) {
    throw Error(
      "Timed out after ${timeoutMs}ms waiting for CameraX operation \"$operationName\" to complete.",
      error,
    )
  }
}

private fun <T> ListenableFuture<T>.getCompleted(): T {
  return try {
    get()
  } catch (error: ExecutionException) {
    throw error.cause ?: error
  }
}
