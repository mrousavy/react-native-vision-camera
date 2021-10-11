package com.mrousavy.camera

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.RCTEventEmitter

fun CameraView.invokeOnInitialized() {
  Log.i(CameraView.TAG, "invokeOnInitialized()")

  val reactContext = context as ReactContext
  reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "cameraInitialized", null)
}

fun CameraView.invokeOnError(error: Throwable) {
  Log.e(CameraView.TAG, "invokeOnError(...):")
  error.printStackTrace()

  val cameraError = when (error) {
    is CameraError -> error
    else -> UnknownCameraError(error)
  }
  val event = Arguments.createMap()
  event.putString("code", cameraError.code)
  event.putString("message", cameraError.message)
  cameraError.cause?.let { cause ->
    event.putMap("cause", errorToMap(cause))
  }
  val reactContext = context as ReactContext
  reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "cameraError", event)
}

fun CameraView.invokeOnFrameProcessorPerformanceSuggestionAvailable(currentFps: Double, suggestedFps: Double) {
  Log.e(CameraView.TAG, "invokeOnFrameProcessorPerformanceSuggestionAvailable(suggestedFps: $suggestedFps):")

  val event = Arguments.createMap()
  val type = if (suggestedFps > currentFps) "can-use-higher-fps" else "should-use-lower-fps"
  event.putString("type", type)
  event.putDouble("suggestedFrameProcessorFps", suggestedFps)
  val reactContext = context as ReactContext
  reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "cameraPerformanceSuggestionAvailable", event)
}

fun CameraView.invokeOnViewReady() {
  val event = Arguments.createMap()
  val reactContext = context as ReactContext
  reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "cameraViewReady", event)
}

private fun errorToMap(error: Throwable): WritableMap {
  val map = Arguments.createMap()
  map.putString("message", error.message)
  map.putString("stacktrace", error.stackTraceToString())
  error.cause?.let { cause ->
    map.putMap("cause", errorToMap(cause))
  }
  return map
}
