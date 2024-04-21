package com.mrousavy.camera.react.utils

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap

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
