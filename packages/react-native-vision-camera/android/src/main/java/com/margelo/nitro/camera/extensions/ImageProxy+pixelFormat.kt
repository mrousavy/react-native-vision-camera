package com.margelo.nitro.camera.extensions

import android.graphics.ImageFormat
import androidx.camera.core.ImageProxy
import com.margelo.nitro.camera.DepthPixelFormat
import com.margelo.nitro.camera.PixelFormat
import com.margelo.nitro.camera.extensions.converters.fromImageFormat

val ImageProxy.pixelFormat: PixelFormat
  get() = PixelFormat.fromImageFormat(format)

val ImageProxy.depthPixelFormat: DepthPixelFormat
  get() {
    return when (format) {
      ImageFormat.DEPTH16 -> DepthPixelFormat.DEPTH_16_BIT
      ImageFormat.DEPTH_POINT_CLOUD -> DepthPixelFormat.DEPTH_POINT_CLOUD_32_BIT
      else -> DepthPixelFormat.UNKNOWN
    }
  }
