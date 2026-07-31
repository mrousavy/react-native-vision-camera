package com.margelo.nitro.camera.barcodescanner.extensions

import com.google.android.gms.tasks.Task
import kotlinx.coroutines.suspendCancellableCoroutine
import java.util.concurrent.Executor
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

private val directExecutor = Executor { runnable -> runnable.run() }

internal suspend fun <T> Task<T>.await(): T {
  return suspendCancellableCoroutine { continuation ->
    addOnCompleteListener(directExecutor) { task ->
      if (!continuation.isActive) return@addOnCompleteListener

      when {
        task.isSuccessful -> continuation.resume(task.result)
        task.isCanceled -> continuation.cancel()
        else -> {
          continuation.resumeWithException(
            task.exception ?: RuntimeException("Task failed without exception"),
          )
        }
      }
    }
  }
}
