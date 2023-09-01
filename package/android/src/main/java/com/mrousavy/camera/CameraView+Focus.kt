package com.mrousavy.camera

import com.facebook.react.bridge.ReadableMap

suspend fun CameraView.focus(pointMap: ReadableMap) {
  val x = pointMap.getInt("x")
  val y = pointMap.getInt("y")
  cameraSession.focus(x, y)
}
