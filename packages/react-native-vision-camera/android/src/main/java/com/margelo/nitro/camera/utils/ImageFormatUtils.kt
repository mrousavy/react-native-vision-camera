package com.margelo.nitro.camera.utils

import android.graphics.ImageFormat

object ImageFormatUtils {
  val allVideoFormats =
    arrayOf(
      // YUV
      ImageFormat.PRIVATE,
      ImageFormat.YUV_420_888,
      ImageFormat.YUV_422_888,
      ImageFormat.YUV_444_888,
      ImageFormat.YCBCR_P010,
      ImageFormat.YCBCR_P210,
      // RGB
      ImageFormat.FLEX_RGB_888,
      ImageFormat.FLEX_RGBA_8888,
    )
  val allDepthFormats =
    arrayOf(
      ImageFormat.DEPTH16,
      ImageFormat.DEPTH_JPEG,
      ImageFormat.DEPTH_POINT_CLOUD,
    )
  private val allRawFormats =
    arrayOf(
      ImageFormat.RAW_SENSOR,
      ImageFormat.RAW_PRIVATE,
      ImageFormat.RAW12,
      ImageFormat.RAW10,
    )
  private val allPhotoFormats =
    arrayOf(
      ImageFormat.JPEG,
      ImageFormat.JPEG_R,
      ImageFormat.DEPTH_JPEG,
      ImageFormat.RAW_SENSOR,
      ImageFormat.HEIC,
      ImageFormat.HEIC_ULTRAHDR,
    )
  private val allPhotoHdrFormats =
    arrayOf(
      ImageFormat.HEIC_ULTRAHDR,
      ImageFormat.JPEG_R,
    )

  fun isVideoFormat(format: Int): Boolean {
    return allVideoFormats.contains(format)
  }

  fun isDepthFormat(format: Int): Boolean {
    return allDepthFormats.contains(format)
  }

  fun isRawFormat(format: Int): Boolean {
    return allRawFormats.contains(format)
  }

  fun isPhotoFormat(format: Int): Boolean {
    return allPhotoFormats.contains(format)
  }

  fun isPhotoHdrFormat(format: Int): Boolean {
    return allPhotoHdrFormats.contains(format)
  }
}
