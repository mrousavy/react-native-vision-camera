package com.mrousavy.camera

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.google.mlkit.vision.barcode.common.Barcode
import com.mrousavy.camera.core.CameraError
import com.mrousavy.camera.core.CodeScannerFrame
import com.mrousavy.camera.core.UnknownCameraError
import com.mrousavy.camera.core.code
import com.mrousavy.camera.types.CodeType

fun CameraView.invokeOnInitialized() {
  Log.i(CameraView.TAG, "invokeOnInitialized()")

  val reactContext = context as ReactContext
  reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "cameraInitialized", null)
}

fun CameraView.invokeOnStarted() {
  Log.i(CameraView.TAG, "invokeOnStarted()")

  val reactContext = context as ReactContext
  reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "cameraStarted", null)
}

fun CameraView.invokeOnStopped() {
  Log.i(CameraView.TAG, "invokeOnStopped()")

  val reactContext = context as ReactContext
  reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "cameraStopped", null)
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

fun CameraView.invokeOnCodeScanned(barcodes: List<Barcode>, scannerFrame: CodeScannerFrame) {
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

    barcode.cornerPoints?.let { points ->
      val corners = Arguments.createArray()
      points.forEach { point ->
        val pt = Arguments.createMap()
        pt.putInt("x", point.x)
        pt.putInt("y", point.y)
        corners.pushMap(pt)
      }
      code.putArray("corners", corners)
    }
    codes.pushMap(code)
  }

  val event = Arguments.createMap()
  event.putArray("codes", codes)
  val codeScannerFrame = Arguments.createMap()
  codeScannerFrame.putInt("width", scannerFrame.width)
  codeScannerFrame.putInt("height", scannerFrame.height)
  event.putMap("frame", codeScannerFrame)
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
