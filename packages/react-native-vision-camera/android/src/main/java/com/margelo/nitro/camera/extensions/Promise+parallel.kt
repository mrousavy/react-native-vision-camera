package com.margelo.nitro.camera.extensions

import com.margelo.nitro.core.Promise
import java.util.concurrent.Executor

fun <T> Promise.Companion.parallel(
  executor: Executor,
  run: () -> T,
): Promise<T> {
  val promise = Promise<T>()
  executor.execute {
    try {
      val result = run()
      promise.resolve(result)
    } catch (e: Throwable) {
      promise.reject(e)
    }
  }
  return promise
}
