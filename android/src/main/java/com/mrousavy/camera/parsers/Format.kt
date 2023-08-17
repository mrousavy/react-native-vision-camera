package com.mrousavy.camera.parsers

import android.graphics.ImageFormat
import android.graphics.PixelFormat

enum class Format(override val unionValue: String): JSUnionValue {
  YUV("yuv"),
  RGB("rgb"),
  DNG("dng"),
  NATIVE("native"),
  UNKNOWN("unknown");

  companion object {
    fun fromImageFormat(imageFormat: Int): Format {
      return when (imageFormat) {
        ImageFormat.YUV_420_888 -> YUV
        ImageFormat.NV21 -> YUV
        ImageFormat.JPEG -> RGB
        PixelFormat.RGB_888 -> RGB
        ImageFormat.DEPTH_JPEG -> DNG
        ImageFormat.PRIVATE -> NATIVE
        else -> UNKNOWN
      }
    }
  }
}
