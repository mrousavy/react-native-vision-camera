package com.mrousavy.camera.parsers

import android.graphics.ImageFormat
import android.graphics.PixelFormat
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.params.StreamConfigurationMap
import com.mrousavy.camera.PixelFormatNotSupportedError

@Suppress("FoldInitializerAndIfToElvis")
enum class Format(override val unionValue: String): JSUnionValue {
  YUV("yuv"),
  RGB("rgb"),
  DNG("dng"),
  NATIVE("native"),
  UNKNOWN("unknown");

  private fun bestMatch(formats: IntArray, targetFormats: Array<Int>): Int? {
    targetFormats.forEach { format ->
      if (formats.contains(format)) return format
    }
    return null
  }

  fun toImageFormat(characteristics: CameraCharacteristics): Int {
    val configuration = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
    val formats = configuration.outputFormats

    val result = when (this) {
      YUV -> bestMatch(formats, arrayOf(ImageFormat.YUV_420_888, ImageFormat.YUV_422_888, ImageFormat.YUV_444_888, ImageFormat.NV21))
      RGB -> bestMatch(formats, arrayOf(ImageFormat.JPEG, PixelFormat.RGB_888))
      DNG -> bestMatch(formats, arrayOf(ImageFormat.DEPTH_JPEG))
      NATIVE -> ImageFormat.PRIVATE
      UNKNOWN -> null
    }
    if (result == null) {
      throw PixelFormatNotSupportedError(this.unionValue)
    }
    return result
  }

  companion object: JSUnionValue.Companion<Format> {
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

    override fun fromUnionValue(unionValue: String?): Format? {
      return when (unionValue) {
        "yuv" -> YUV
        "rgb" -> RGB
        "dng" -> DNG
        "native" -> NATIVE
        "unknown" -> UNKNOWN
        else -> null
      }
    }
  }
}
