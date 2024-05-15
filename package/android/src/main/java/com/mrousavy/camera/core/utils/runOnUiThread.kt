package com.mrousavy.camera.core.utils

import com.facebook.react.bridge.UiThreadUtil
import kotlin.coroutines.cancellation.CancellationException
import kotlin.coroutines.resume
import kotlinx.coroutines.suspendCancellableCoroutine

suspend inline fun <T> runOnUiThreadAndWait(crossinline function: () -> T): T {
  if (UiThreadUtil.isOnUiThread()) {
    // We are already on UI Thread - immediately call the function
    return function()
  }

  return suspendCancellableCoroutine { continuation ->
    UiThreadUtil.runOnUiThread {
      if (continuation.isCancelled) throw CancellationException()
      val result = function()
      continuation.resume(result)
    }
  }
}

inline fun runOnUiThread(crossinline function: () -> Unit) {
  if (UiThreadUtil.isOnUiThread()) {
    // We are already on UI Thread - immediately call the function
    return function()
  }

  UiThreadUtil.runOnUiThread {
    function()
  }
}
