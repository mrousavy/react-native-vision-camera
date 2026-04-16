package com.margelo.nitro.camera.extensions

import com.margelo.nitro.camera.PhotoContainerFormat
import com.margelo.nitro.camera.TargetPhotoContainerFormat

val PhotoContainerFormat.fileExtension: String
  get() {
    return when (this) {
      PhotoContainerFormat.DCM -> ".dcm"
      PhotoContainerFormat.DNG -> ".dng"
      PhotoContainerFormat.HEIC -> ".heic"
      PhotoContainerFormat.JPEG -> ".jpg"
      PhotoContainerFormat.TIFF -> ".tiff"
      PhotoContainerFormat.UNKNOWN -> ""
    }
  }

val TargetPhotoContainerFormat.fileExtension: String
  get() {
    val containerFormat =
      when (this) {
        TargetPhotoContainerFormat.DNG -> PhotoContainerFormat.DNG
        TargetPhotoContainerFormat.HEIC -> PhotoContainerFormat.HEIC
        TargetPhotoContainerFormat.JPEG -> PhotoContainerFormat.JPEG
        TargetPhotoContainerFormat.NATIVE -> PhotoContainerFormat.JPEG
      }
    return containerFormat.fileExtension
  }
