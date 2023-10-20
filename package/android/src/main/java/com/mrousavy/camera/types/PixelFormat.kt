package com.mrousavy.camera.types

import android.graphics.ImageFormat
import com.mrousavy.camera.core.InvalidTypeScriptUnionError
import com.mrousavy.camera.core.PixelFormatNotSupportedError

enum class PixelFormat(override val unionValue: String) : JSUnionValue {
  YUV("yuv"),
  RGB("rgb"),
  NATIVE("native"),
  UNKNOWN("unknown");

  fun toImageFormat(): Int =
    when (this) {
      YUV -> ImageFormat.YUV_420_888
      NATIVE -> ImageFormat.PRIVATE
      else -> throw PixelFormatNotSupportedError(this.unionValue)
    }

  companion object : JSUnionValue.Companion<PixelFormat> {
    fun fromImageFormat(imageFormat: Int): PixelFormat =
      when (imageFormat) {
        ImageFormat.YUV_420_888 -> YUV
        ImageFormat.PRIVATE -> NATIVE
        else -> UNKNOWN
      }

    override fun fromUnionValue(unionValue: String?): PixelFormat =
      when (unionValue) {
        "yuv" -> YUV
        "rgb" -> RGB
        "native" -> NATIVE
        "unknown" -> UNKNOWN
        else -> throw InvalidTypeScriptUnionError("pixelFormat", unionValue)
      }
  }
}
