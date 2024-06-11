package com.mrousavy.camera.react

import android.content.res.Resources
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.core.FocusRequiresPreviewError
import com.mrousavy.camera.core.focus
import com.mrousavy.camera.core.utils.runOnUiThreadAndWait

suspend fun CameraView.focus(pointMap: ReadableMap) {
  val x = pointMap.getDouble("x")
  val y = pointMap.getDouble("y")
  val previewView = previewView ?: throw FocusRequiresPreviewError()

  val point = runOnUiThreadAndWait {
    val dp = Resources.getSystem().displayMetrics.density
    previewView.meteringPointFactory.createPoint(x.toFloat() * dp, y.toFloat() * dp)
  }
  cameraSession.focus(point)
}
