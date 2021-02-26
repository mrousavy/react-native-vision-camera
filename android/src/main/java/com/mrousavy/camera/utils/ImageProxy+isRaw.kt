package com.mrousavy.camera.utils

import android.graphics.ImageFormat
import androidx.camera.core.ImageProxy

val ImageProxy.isRaw: Boolean
  get() {
    return when (format) {
      ImageFormat.RAW_SENSOR, ImageFormat.RAW10, ImageFormat.RAW12, ImageFormat.RAW_PRIVATE -> true
      else -> false
    }
  }
