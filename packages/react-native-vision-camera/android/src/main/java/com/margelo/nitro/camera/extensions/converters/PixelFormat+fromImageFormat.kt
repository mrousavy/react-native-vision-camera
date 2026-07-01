package com.margelo.nitro.camera.extensions.converters

import android.graphics.ImageFormat
import android.graphics.PixelFormat as AndroidPixelFormat
import com.margelo.nitro.camera.PixelFormat
import com.margelo.nitro.camera.utils.PixelRange

fun PixelFormat.Companion.fromImageFormat(
  imageFormat: Int,
  range: PixelRange,
): PixelFormat {
  return when (imageFormat) {
    ImageFormat.FLEX_RGB_888 -> PixelFormat.RGB_RGB_8_BIT
    ImageFormat.FLEX_RGBA_8888 -> PixelFormat.RGB_RGBA_8_BIT
    AndroidPixelFormat.RGBA_8888 -> PixelFormat.RGB_RGBA_8_BIT
    AndroidPixelFormat.RGBX_8888 -> PixelFormat.RGB_RGB_8_BIT
    AndroidPixelFormat.RGB_888 -> PixelFormat.RGB_RGB_8_BIT
    ImageFormat.RAW_SENSOR -> PixelFormat.RAW_BAYER_UNPACKED_16_BIT
    ImageFormat.RAW12 -> PixelFormat.RAW_BAYER_PACKED96_12_BIT
    ImageFormat.DEPTH16 -> PixelFormat.DEPTH_16_BIT
    ImageFormat.DEPTH_POINT_CLOUD -> PixelFormat.DEPTH_POINT_CLOUD_32_BIT
    ImageFormat.YUV_420_888 -> {
      when (range) {
        PixelRange.VIDEO -> PixelFormat.YUV_420_8_BIT_VIDEO
        else -> PixelFormat.YUV_420_8_BIT_FULL
      }
    }
    ImageFormat.YUV_422_888 -> {
      when (range) {
        PixelRange.VIDEO -> PixelFormat.YUV_422_8_BIT_VIDEO
        else -> PixelFormat.YUV_422_8_BIT_FULL
      }
    }
    ImageFormat.YUV_444_888 -> {
      when (range) {
        PixelRange.VIDEO -> PixelFormat.YUV_444_8_BIT_VIDEO
        else -> PixelFormat.YUV_444_8_BIT_FULL
      }
    }
    ImageFormat.YCBCR_P010 -> {
      when (range) {
        PixelRange.VIDEO -> PixelFormat.YUV_420_10_BIT_VIDEO
        else -> PixelFormat.YUV_420_10_BIT_FULL
      }
    }
    ImageFormat.YCBCR_P210 -> {
      when (range) {
        PixelRange.VIDEO -> PixelFormat.YUV_422_10_BIT_VIDEO
        else -> PixelFormat.YUV_422_10_BIT_FULL
      }
    }
    ImageFormat.PRIVATE -> PixelFormat.PRIVATE
    else -> PixelFormat.UNKNOWN
  }
}
