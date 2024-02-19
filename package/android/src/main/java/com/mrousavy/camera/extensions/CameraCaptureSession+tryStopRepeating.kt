package com.mrousavy.camera.extensions

import android.hardware.camera2.CameraCaptureSession

fun CameraCaptureSession.tryStopRepeating() {
  try {
    stopRepeating()
  } catch (_: Throwable) {}
}
