package com.margelo.nitro.camera.extensions

import android.graphics.ImageFormat
import androidx.camera.core.ImageProxy
import com.margelo.nitro.camera.PhotoContainerFormat

val ImageProxy.photoContainerFormat: PhotoContainerFormat
  get() {
    return when (format) {
      ImageFormat.JPEG, ImageFormat.JPEG_R, ImageFormat.DEPTH_JPEG -> PhotoContainerFormat.JPEG
      ImageFormat.RAW10, ImageFormat.RAW12, ImageFormat.RAW_SENSOR, ImageFormat.RAW_PRIVATE -> PhotoContainerFormat.DNG
      else -> PhotoContainerFormat.UNKNOWN
    }
  }

val ImageProxy.isRAW: Boolean
  get() {
    return when (format) {
      ImageFormat.RAW10, ImageFormat.RAW12, ImageFormat.RAW_SENSOR, ImageFormat.RAW_PRIVATE -> true
      else -> false
    }
  }
