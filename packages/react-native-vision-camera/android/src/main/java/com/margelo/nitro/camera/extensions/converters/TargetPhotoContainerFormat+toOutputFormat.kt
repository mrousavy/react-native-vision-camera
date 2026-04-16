package com.margelo.nitro.camera.extensions.converters

import androidx.camera.core.ImageCapture
import com.margelo.nitro.camera.TargetPhotoContainerFormat

fun TargetPhotoContainerFormat.toOutputFormat(allowHDR: Boolean): @ImageCapture.OutputFormat Int {
  return when (this) {
    TargetPhotoContainerFormat.JPEG -> {
      if (allowHDR) {
        // JPEG with Ultra HDR
        ImageCapture.OUTPUT_FORMAT_JPEG_ULTRA_HDR
      } else {
        // Normal JPEG
        ImageCapture.OUTPUT_FORMAT_JPEG
      }
    }
    TargetPhotoContainerFormat.HEIC -> {
      // TODO: Figure out if we can capture HEIC on Android
      throw Error("PhotoContainerFormat \"heic\" is not supported on this Device!")
    }
    TargetPhotoContainerFormat.DNG -> {
      // DNG = RAW
      ImageCapture.OUTPUT_FORMAT_RAW
    }
    TargetPhotoContainerFormat.NATIVE -> {
      // JPEG is the default format on Android
      ImageCapture.OUTPUT_FORMAT_JPEG
    }
  }
}
