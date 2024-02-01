package com.mrousavy.camera.extensions

import android.hardware.camera2.CameraCaptureSession

fun CameraCaptureSession.tryAbortCaptures() {
  try {
    abortCaptures()
  } catch (_: Throwable) {}
}
