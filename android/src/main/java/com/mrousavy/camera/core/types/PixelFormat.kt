package com.mrousavy.camera.core.types

import android.graphics.ImageFormat
import android.util.Log
import androidx.camera.core.ImageAnalysis
import com.mrousavy.camera.core.InvalidTypeScriptUnionError
import com.mrousavy.camera.core.PixelFormatNotSupportedError
import com.mrousavy.camera.core.utils.ImageFormatUtils

enum class PixelFormat(override val unionValue: String) : JSUnionValue {
  YUV("yuv"),
  RGB("rgb"),
  UNKNOWN("unknown");

  fun toImageAnalysisFormat(): Int =
    when (this) {
      YUV -> ImageAnalysis.OUTPUT_IMAGE_FORMAT_YUV_420_888
      RGB -> ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888
      else -> throw PixelFormatNotSupportedError(this.unionValue)
    }

  companion object : JSUnionValue.Companion<PixelFormat> {
    private const val TAG = "PixelFormat"
    fun fromImageFormat(imageFormat: Int): PixelFormat =
      when (imageFormat) {
        ImageFormat.YUV_420_888 -> YUV

        android.graphics.PixelFormat.RGBA_8888 -> RGB

        else -> {
          Log.w(TAG, "Unknown PixelFormat! ${ImageFormatUtils.imageFormatToString(imageFormat)}")
          UNKNOWN
        }
      }

    override fun fromUnionValue(unionValue: String?): PixelFormat =
      when (unionValue) {
        "yuv" -> YUV
        "rgb" -> RGB
        "unknown" -> UNKNOWN
        else -> throw InvalidTypeScriptUnionError("pixelFormat", unionValue)
      }
  }
}
