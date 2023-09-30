package com.mrousavy.camera.parsers

import android.graphics.ImageFormat
import com.mrousavy.camera.PixelFormatNotSupportedError

@Suppress("FoldInitializerAndIfToElvis")
enum class PixelFormat(override val unionValue: String) : JSUnionValue {
  YUV("yuv"),
  RGB("rgb"),
  NATIVE("native"),
  UNKNOWN("unknown");

  fun toImageFormat(): Int {
    val result = when (this) {
      YUV -> ImageFormat.YUV_420_888
      RGB -> android.graphics.PixelFormat.RGBA_8888
      NATIVE -> ImageFormat.PRIVATE
      UNKNOWN -> null
    }
    if (result == null) {
      throw PixelFormatNotSupportedError(this.unionValue)
    }
    return result
  }

  companion object : JSUnionValue.Companion<PixelFormat> {
    fun fromImageFormat(imageFormat: Int): PixelFormat =
      when (imageFormat) {
        ImageFormat.YUV_420_888 -> YUV
        android.graphics.PixelFormat.RGBA_8888 -> RGB
        ImageFormat.PRIVATE -> NATIVE
        else -> UNKNOWN
      }

    override fun fromUnionValue(unionValue: String?): PixelFormat? =
      when (unionValue) {
        "yuv" -> YUV
        "rgb" -> RGB
        "native" -> NATIVE
        "unknown" -> UNKNOWN
        else -> null
      }
  }
}
