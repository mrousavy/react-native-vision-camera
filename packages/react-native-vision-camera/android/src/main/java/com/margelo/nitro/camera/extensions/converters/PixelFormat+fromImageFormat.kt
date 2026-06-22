package com.margelo.nitro.camera.extensions.converters

import android.graphics.ImageFormat
import com.margelo.nitro.camera.PixelFormat
import com.margelo.nitro.camera.utils.PixelRange

fun PixelFormat.Companion.fromImageFormat(
  imageFormat: Int,
  range: PixelRange,
): PixelFormat {
  return when (imageFormat) {
    ImageFormat.FLEX_RGB_888 -> PixelFormat.RGB_RGB_8_BIT
    ImageFormat.FLEX_RGBA_8888 -> PixelFormat.RGB_RGBA_8_BIT
    ImageFormat.DEPTH16 -> PixelFormat.DEPTH_16_BIT
    ImageFormat.DEPTH_POINT_CLOUD -> PixelFormat.DEPTH_POINT_CLOUD_32_BIT
    ImageFormat.YUV_420_888 -> {
      when (range) {
        PixelRange.FULL -> PixelFormat.YUV_420_8_BIT_FULL
        else -> PixelFormat.YUV_420_8_BIT_VIDEO
      }
    }
    ImageFormat.YUV_422_888 -> {
      when (range) {
        PixelRange.FULL -> PixelFormat.YUV_422_8_BIT_FULL
        else -> PixelFormat.YUV_422_8_BIT_VIDEO
      }
    }
    ImageFormat.YUV_444_888 -> {
      when (range) {
        PixelRange.FULL -> PixelFormat.YUV_444_8_BIT_FULL
        else -> PixelFormat.YUV_444_8_BIT_VIDEO
      }
    }
    ImageFormat.YCBCR_P010 -> {
      when (range) {
        PixelRange.FULL -> PixelFormat.YUV_420_10_BIT_FULL
        else -> PixelFormat.YUV_420_10_BIT_VIDEO
      }
    }
    ImageFormat.YCBCR_P210 -> {
      when (range) {
        PixelRange.FULL -> PixelFormat.YUV_422_10_BIT_FULL
        else -> PixelFormat.YUV_422_10_BIT_VIDEO
      }
    }
    ImageFormat.PRIVATE -> PixelFormat.PRIVATE
    else -> PixelFormat.UNKNOWN
  }
}
