package com.mrousavy.camera.core.extensions

import android.hardware.camera2.CaptureRequest
import android.util.Range
import androidx.annotation.OptIn
import androidx.camera.camera2.interop.Camera2Interop
import androidx.camera.camera2.interop.ExperimentalCamera2Interop
import androidx.camera.core.ImageAnalysis

@OptIn(ExperimentalCamera2Interop::class)
fun ImageAnalysis.Builder.setTargetFrameRate(frameRate: Range<Int>) {
  val camera2Interop = Camera2Interop.Extender(this)
  camera2Interop.setCaptureRequestOption(
    CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE,
    frameRate
  )
}
