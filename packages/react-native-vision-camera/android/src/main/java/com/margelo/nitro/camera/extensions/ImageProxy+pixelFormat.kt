package com.margelo.nitro.camera.extensions

import android.graphics.ImageFormat
import android.hardware.DataSpace
import androidx.camera.core.ImageProxy
import com.margelo.nitro.camera.DepthPixelFormat
import com.margelo.nitro.camera.PixelFormat
import com.margelo.nitro.camera.extensions.converters.fromImageFormat
import com.margelo.nitro.camera.utils.PixelRange

private val ImageProxy.pixelRange: PixelRange
  get() {
    val dataSpace = image?.dataSpace ?: return PixelRange.UNKNOWN
    val range = DataSpace.getRange(dataSpace)
    return when (range) {
      DataSpace.RANGE_LIMITED -> PixelRange.VIDEO
      DataSpace.RANGE_FULL -> PixelRange.FULL
      DataSpace.RANGE_EXTENDED -> PixelRange.EXTENDED
      else -> PixelRange.UNKNOWN
    }
  }

val ImageProxy.pixelFormat: PixelFormat
  get() {
    return PixelFormat.fromImageFormat(format, pixelRange)
  }

val ImageProxy.depthPixelFormat: DepthPixelFormat
  get() {
    return when (format) {
      ImageFormat.DEPTH16 -> DepthPixelFormat.DEPTH_16_BIT
      ImageFormat.DEPTH_POINT_CLOUD -> DepthPixelFormat.DEPTH_POINT_CLOUD_32_BIT
      else -> DepthPixelFormat.UNKNOWN
    }
  }
