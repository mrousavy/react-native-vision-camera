package com.mrousavy.camera.utils

import android.graphics.ImageFormat
import android.hardware.HardwareBuffer
import android.media.ImageReader
import android.os.Build

class HardwareBufferUtils {
  companion object {
    fun getHardwareBufferFormat(imageFormat: Int): Int {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        // Dynamically create an ImageReader with the target ImageFormat, and then
        // get it's HardwareBuffer format to see what it uses underneath.
        val imageReader = ImageReader.newInstance(1, 1, imageFormat, 1, HardwareBuffer.USAGE_GPU_SAMPLED_IMAGE)
        val format = imageReader.hardwareBufferFormat
        imageReader.close()
        return format
      }

      if (imageFormat == ImageFormat.PRIVATE) {
        // PRIVATE formats are opaque, their actual equivalent HardwareBuffer format is unknown.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
          // We can assume that YUV 4:2:0 or RGB is used.
          return HardwareBuffer.YCBCR_420_888
        } else {
          // Maybe assume we are on RGB if we're not on API R or above...
          return HardwareBuffer.RGB_888
        }
      }

      // According to PublicFormat.cpp in Android's codebase, the formats map 1:1 anyways..
      // https://cs.android.com/android/platform/superproject/main/+/main:frameworks/native/libs/ui/PublicFormat.cpp
      return imageFormat
    }
  }
}
