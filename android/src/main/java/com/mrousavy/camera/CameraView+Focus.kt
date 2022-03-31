package com.mrousavy.camera

import androidx.camera.core.FocusMeteringAction
import com.facebook.react.bridge.ReadableMap
import kotlinx.coroutines.guava.await
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

suspend fun CameraView.focus(pointMap: ReadableMap) {
  val cameraControl = camera?.cameraControl ?: throw CameraNotReadyError()
  if (!pointMap.hasKey("x") || !pointMap.hasKey("y")) {
    throw InvalidTypeScriptUnionError("point", pointMap.toString())
  }

  val dpi = resources.displayMetrics.density
  val x = pointMap.getDouble("x") * dpi
  val y = pointMap.getDouble("y") * dpi

  // Getting the point from the previewView needs to be run on the UI thread
  val point = withContext(coroutineScope.coroutineContext) {
    previewView.meteringPointFactory.createPoint(x.toFloat(), y.toFloat());
  }

  val action = FocusMeteringAction.Builder(point, FocusMeteringAction.FLAG_AF or FocusMeteringAction.FLAG_AE)
    .setAutoCancelDuration(5, TimeUnit.SECONDS) // auto-reset after 5 seconds
    .build()

  cameraControl.startFocusAndMetering(action).await()
}
