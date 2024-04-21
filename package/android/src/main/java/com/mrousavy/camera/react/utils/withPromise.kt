package com.mrousavy.camera.react.utils

import com.facebook.react.bridge.Promise
import com.mrousavy.camera.core.CameraError
import com.mrousavy.camera.core.UnknownCameraError

inline fun withPromise(promise: Promise, closure: () -> Any?) {
  try {
    val result = closure()
    promise.resolve(result)
  } catch (e: Throwable) {
    e.printStackTrace()
    val error = if (e is CameraError) e else UnknownCameraError(e)
    promise.reject("${error.domain}/${error.id}", error.message, error.cause)
  }
}
