package com.mrousavy.camera.react

import android.content.res.Resources
import androidx.camera.core.SurfaceOrientedMeteringPointFactory
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.core.FocusRequiresPreviewError
import com.mrousavy.camera.core.focus
import com.mrousavy.camera.core.utils.runOnUiThreadAndWait

suspend fun CameraView.focusInPreviewViewCoordinates(x: Float, y: Float) {
  val previewView = previewView ?: throw FocusRequiresPreviewError()

  val point = runOnUiThreadAndWait {
    val dp = Resources.getSystem().displayMetrics.density
    previewView.meteringPointFactory.createPoint(x * dp, y * dp)
  }
  cameraSession.focus(point)
}

suspend fun CameraView.focusInCameraCoordinates(x: Float, y: Float) {
  val factory = SurfaceOrientedMeteringPointFactory(1f, 1f)
  val point = factory.createPoint(x, y)
  cameraSession.focus(point)
}
