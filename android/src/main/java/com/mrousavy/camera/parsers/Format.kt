package com.mrousavy.camera.parsers

import android.graphics.ImageFormat
import android.graphics.PixelFormat
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.params.StreamConfigurationMap
import com.mrousavy.camera.PixelFormatNotSupportedError

enum class Format(override val unionValue: String): JSUnionValue {
  YUV("yuv"),
  RGB("rgb"),
  DNG("dng"),
  NATIVE("native"),
  UNKNOWN("unknown");

  fun toImageFormat(characteristics: CameraCharacteristics): Int {
    val configuration = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
    val formats = configuration.outputFormats

    val result = when (this) {
      YUV -> {
        if (formats.contains(ImageFormat.YUV_420_888)) {
          ImageFormat.YUV_420_888
        } else if (formats.contains(ImageFormat.YUV_422_888)) {
          ImageFormat.YUV_422_888
        } else if (formats.contains(ImageFormat.YUV_444_888)) {
          ImageFormat.YUV_444_888
        } else if (formats.contains(ImageFormat.NV21)) {
          ImageFormat.NV21
        } else {
          null
        }
      }
      RGB -> {
        if (formats.contains(PixelFormat.RGB_888)) {
          PixelFormat.RGB_888
        } else {
          null
        }
      }
      DNG -> {
        if (formats.contains(ImageFormat.DEPTH_JPEG)) {
          return ImageFormat.DEPTH_JPEG
        } else {
          null
        }
      }
      NATIVE -> {
        ImageFormat.PRIVATE
      }
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
