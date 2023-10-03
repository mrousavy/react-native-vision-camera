package com.mrousavy.camera.parsers

import android.graphics.ImageFormat
import com.mrousavy.camera.PixelFormatNotSupportedError

enum class PixelFormat(override val unionValue: String) : JSUnionValue {
  YUV("yuv"),
  RGB("rgb"),
  NATIVE("native"),
  UNKNOWN("unknown");

  fun toImageFormat(): Int {
    return when (this) {
      YUV -> ImageFormat.YUV_420_888
      NATIVE -> ImageFormat.PRIVATE
      else -> throw PixelFormatNotSupportedError(this.unionValue)
    }
  }

  companion object : JSUnionValue.Companion<PixelFormat> {
    fun fromImageFormat(imageFormat: Int): PixelFormat {
      return when (imageFormat) {
        ImageFormat.YUV_420_888 -> YUV
        ImageFormat.PRIVATE -> NATIVE
        else -> UNKNOWN
      }
    }

    override fun fromUnionValue(unionValue: String?): PixelFormat? {
      return when (unionValue) {
        "yuv" -> YUV
        "rgb" -> RGB
        "native" -> NATIVE
        "unknown" -> UNKNOWN
        else -> null
      }
    }
  }
}
