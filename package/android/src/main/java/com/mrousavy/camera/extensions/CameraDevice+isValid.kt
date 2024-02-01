package com.mrousavy.camera.extensions

import android.hardware.camera2.CameraDevice

val CameraDevice.isValid: Boolean
  get() {
    try {
      this.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW)
      return true
    } catch (e: Throwable) {
      return false
    }
  }
