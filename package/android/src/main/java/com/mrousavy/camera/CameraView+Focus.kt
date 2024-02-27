package com.mrousavy.camera

import com.facebook.react.bridge.ReadableMap

suspend fun CameraView.focus(pointMap: ReadableMap) {
  val x = pointMap.getDouble("x")
  val y = pointMap.getDouble("y")

  val point = previewView.meteringPointFactory.createPoint(x.toFloat(), y.toFloat())
  cameraSession.focus(point)
}
