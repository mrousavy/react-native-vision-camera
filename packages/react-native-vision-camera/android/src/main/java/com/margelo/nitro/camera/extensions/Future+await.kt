package com.margelo.nitro.camera.extensions

import com.google.common.util.concurrent.ListenableFuture
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.util.concurrent.ExecutionException
import java.util.concurrent.Executor
import java.util.concurrent.Future
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
        try {
          continuation.resume(getCompleted())
        } catch (error: Throwable) {
          continuation.resumeWithException(error)
        }
      },
      directExecutor,
    )

    continuation.invokeOnCancellation {
      cancel(true)
    }
  }
}

suspend fun <T> Future<T>.await(): T {
  if (this is ListenableFuture<*>) {
    @Suppress("UNCHECKED_CAST")
    return (this as ListenableFuture<T>).await()
  }

  if (this.isDone) {
    return getCompleted()
  }

  return withContext(Dispatchers.Default) {
    return@withContext getCompleted()
  }
}

private fun <T> Future<T>.getCompleted(): T {
  return try {
    get()
  } catch (error: ExecutionException) {
    throw error.cause ?: error
  }
}
