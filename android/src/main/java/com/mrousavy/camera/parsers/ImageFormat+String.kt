package com.mrousavy.camera.parsers

import android.graphics.ImageFormat

/**
 * Parses ImageFormat/PixelFormat int to a string representation useable for the TypeScript types.
 */
fun parseImageFormat(imageFormat: Int): String {
  return when (imageFormat) {
    ImageFormat.YUV_420_888 -> "yuv"
    ImageFormat.YUV_422_888 -> "yuv"
    ImageFormat.YUV_444_888 -> "yuv"
    ImageFormat.JPEG -> "jpeg"
    ImageFormat.DEPTH_JPEG -> "jpeg-depth"
    ImageFormat.RAW_SENSOR -> "raw"
    ImageFormat.RAW_PRIVATE -> "raw"
    ImageFormat.HEIC -> "heic"
    ImageFormat.PRIVATE -> "private"
    ImageFormat.DEPTH16 -> "depth-16"
    else -> "unknown"
    /*
    ImageFormat.UNKNOWN -> "TODOFILL"
    ImageFormat.RGB_565 -> "TODOFILL"
    ImageFormat.YV12 -> "TODOFILL"
    ImageFormat.Y8 -> "TODOFILL"
    ImageFormat.NV16 -> "TODOFILL"
    ImageFormat.NV21 -> "TODOFILL"
    ImageFormat.YUY2 -> "TODOFILL"
    ImageFormat.FLEX_RGB_888 -> "TODOFILL"
    ImageFormat.FLEX_RGBA_8888 -> "TODOFILL"
    ImageFormat.RAW10 -> "TODOFILL"
    ImageFormat.RAW12 -> "TODOFILL"
    ImageFormat.DEPTH_POINT_CLOUD -> "TODOFILL"
    @Suppress("DUPLICATE_LABEL_IN_WHEN")
    PixelFormat.UNKNOWN -> "TODOFILL"
    PixelFormat.TRANSPARENT -> "TODOFILL"
    PixelFormat.TRANSLUCENT -> "TODOFILL"
    PixelFormat.RGBX_8888 -> "TODOFILL"
    PixelFormat.RGBA_F16 -> "TODOFILL"
    PixelFormat.RGBA_8888 -> "TODOFILL"
    PixelFormat.RGBA_1010102 -> "TODOFILL"
    PixelFormat.OPAQUE -> "TODOFILL"
    @Suppress("DUPLICATE_LABEL_IN_WHEN")
    PixelFormat.RGB_565 -> "TODOFILL"
    PixelFormat.RGB_888 -> "TODOFILL"
     */
  }
}
