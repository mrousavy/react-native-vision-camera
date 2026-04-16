package com.margelo.nitro.camera.extensions

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.Future

suspend fun <T> Future<T>.await(): T {
  if (this.isDone) {
    // Throws if error, Throws if cancelled, returns if T
    return this.get()
  }
  return withContext(Dispatchers.Default) {
    return@withContext get()
  }
}
