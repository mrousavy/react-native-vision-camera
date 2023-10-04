package com.mrousavy.camera

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.google.mlkit.vision.barcode.common.Barcode
import com.mrousavy.camera.parsers.CodeType

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

fun CameraView.invokeOnViewReady() {
  val event = Arguments.createMap()
  val reactContext = context as ReactContext
  reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "cameraViewReady", event)
}

fun CameraView.invokeOnCodeScanned(barcodes: List<Barcode>) {
  val codes = Arguments.createArray()
  barcodes.forEach { barcode ->
    val code = Arguments.createMap()
    val type = CodeType.fromBarcodeType(barcode.format)
    code.putString("type", type.unionValue)
    code.putString("value", barcode.rawValue)

    barcode.boundingBox?.let { rect ->
      val frame = Arguments.createMap()
      frame.putInt("x", rect.left)
      frame.putInt("y", rect.top)
      frame.putInt("width", rect.right - rect.left)
      frame.putInt("height", rect.bottom - rect.top)
      code.putMap("frame", frame)
    }
    codes.pushMap(code)
  }

  val event = Arguments.createMap()
  event.putArray("codes", codes)
  val reactContext = context as ReactContext
  reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "cameraCodeScanned", event)
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
