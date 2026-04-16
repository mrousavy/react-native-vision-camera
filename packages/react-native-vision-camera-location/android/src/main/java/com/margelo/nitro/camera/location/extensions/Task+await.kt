package com.margelo.nitro.camera.location.extensions

import com.google.android.gms.tasks.Task
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

suspend fun <T> Task<T>.await(): T =
  suspendCancellableCoroutine { cont ->
    addOnCompleteListener { task ->
      if (!cont.isActive) return@addOnCompleteListener

      when {
        task.isSuccessful -> cont.resume(task.result)
        task.isCanceled -> cont.cancel()
        else -> {
          cont.resumeWithException(
            task.exception ?: RuntimeException("Task failed without exception"),
          )
        }
      }
    }
  }
