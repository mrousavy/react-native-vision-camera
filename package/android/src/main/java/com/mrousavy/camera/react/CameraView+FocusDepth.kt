package com.mrousavy.camera.react

import androidx.camera.camera2.interop.ExperimentalCamera2Interop
import com.mrousavy.camera.core.focusDepth

@ExperimentalCamera2Interop
suspend fun CameraView.focusDepth(distance: Double) {
  cameraSession.focusDepth(distance)
}
