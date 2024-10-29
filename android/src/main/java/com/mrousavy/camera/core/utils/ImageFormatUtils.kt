package com.mrousavy.camera.core.utils

import android.graphics.ImageFormat
import android.graphics.PixelFormat

class ImageFormatUtils {
  companion object {
    fun imageFormatToString(format: Int): String =
      when (format) {
        ImageFormat.YUV_420_888 -> "YUV_420_888"
        ImageFormat.NV21 -> "NV21"
        ImageFormat.NV16 -> "NV16"
        ImageFormat.YV12 -> "YV12"
        ImageFormat.YUV_422_888 -> "YUV_422_888"
        ImageFormat.YCBCR_P010 -> "YCBCR_P010"
        ImageFormat.YUV_444_888 -> "YUV_444_888"
        ImageFormat.YUY2 -> "YUY2"
        ImageFormat.Y8 -> "Y8"
        ImageFormat.JPEG -> "JPEG"
        ImageFormat.RGB_565 -> "RGB_565"
        ImageFormat.FLEX_RGB_888 -> "FLEX_RGB_888"
        ImageFormat.FLEX_RGBA_8888 -> "FLEX_RGBA_8888"
        PixelFormat.RGB_888 -> "RGB_888"
        ImageFormat.PRIVATE -> "PRIVATE"
        else -> "UNKNOWN ($format)"
      }
  }
}
