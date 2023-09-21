package com.mrousavy.camera.parsers

import android.graphics.ImageFormat
import com.mrousavy.camera.PixelFormatNotSupportedError

@Suppress("FoldInitializerAndIfToElvis")
enum class PixelFormat(override val unionValue: String) : JSUnionValue {
  YUV("yuv"),
  RGB("rgb"),
  DNG("dng"),
  NATIVE("native"),
  UNKNOWN("unknown");

  fun toImageFormat(): Int {
    val result = when (this) {
      YUV -> ImageFormat.YUV_420_888
      RGB -> ImageFormat.JPEG
      DNG -> ImageFormat.RAW_SENSOR
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
        ImageFormat.JPEG, ImageFormat.DEPTH_JPEG -> RGB
        ImageFormat.RAW_SENSOR -> DNG
        ImageFormat.PRIVATE -> NATIVE
        else -> UNKNOWN
      }

    override fun fromUnionValue(unionValue: String?): PixelFormat? =
      when (unionValue) {
        "yuv" -> YUV
        "rgb" -> RGB
        "dng" -> DNG
        "native" -> NATIVE
        "unknown" -> UNKNOWN
        else -> null
      }
  }
}
