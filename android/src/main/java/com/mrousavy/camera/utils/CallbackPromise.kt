package com.mrousavy.camera.utils

import com.facebook.react.bridge.*

private fun makeErrorCauseMap(throwable: Throwable): ReadableMap {
  val map = Arguments.createMap()
  map.putString("message", throwable.message)
  map.putString("stacktrace", throwable.stackTraceToString())
  if (throwable.cause != null) {
    map.putMap("cause", makeErrorCauseMap(throwable.cause!!))
  }
  return map
}

fun makeErrorMap(code: String? = null, message: String? = null, throwable: Throwable? = null, userInfo: WritableMap? = null): ReadableMap {
  val map = Arguments.createMap()
  map.putString("code", code)
  map.putString("message", message)
  map.putMap("cause", if (throwable != null) makeErrorCauseMap(throwable) else null)
  map.putMap("userInfo", userInfo)
  return map
}
