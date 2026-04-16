package com.margelo.nitro.camera.extensions.converters

import android.graphics.ImageFormat
import com.margelo.nitro.camera.PhotoContainerFormat
import com.margelo.nitro.camera.utils.ImageFormatUtils

fun PhotoContainerFormat.Companion.fromImageFormat(imageFormat: Int): PhotoContainerFormat {
  return when {
    // HEIC
    imageFormat == ImageFormat.HEIC || imageFormat == ImageFormat.HEIC_ULTRAHDR -> PhotoContainerFormat.HEIC
    // DNG/RAW
    ImageFormatUtils.isRawFormat(imageFormat) -> PhotoContainerFormat.DNG
    // JPEG
    ImageFormatUtils.isPhotoFormat(imageFormat) -> PhotoContainerFormat.JPEG
    else -> PhotoContainerFormat.UNKNOWN
  }
}
