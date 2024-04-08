package com.mrousavy.camera

import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.core.FocusRequiresPreviewError
import com.mrousavy.camera.extensions.px
import com.mrousavy.camera.utils.runOnUiThreadAndWait

suspend fun CameraView.focus(pointMap: ReadableMap) {
  val x = pointMap.getDouble("x")
  val y = pointMap.getDouble("y")
  val previewView = previewView ?: throw FocusRequiresPreviewError()

  val point = runOnUiThreadAndWait {
    previewView.meteringPointFactory.createPoint(x.toFloat().px, y.toFloat().px)
  }
  cameraSession.focus(point)
}
