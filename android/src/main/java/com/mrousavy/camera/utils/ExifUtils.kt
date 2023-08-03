package com.mrousavy.camera.utils

import androidx.exifinterface.media.ExifInterface

class ExifUtils {
  companion object {
    fun computeExifOrientation(rotationDegrees: Int, mirrored: Boolean) = when {
      rotationDegrees == 0 && !mirrored -> ExifInterface.ORIENTATION_NORMAL
      rotationDegrees == 0 && mirrored -> ExifInterface.ORIENTATION_FLIP_HORIZONTAL
      rotationDegrees == 180 && !mirrored -> ExifInterface.ORIENTATION_ROTATE_180
      rotationDegrees == 180 && mirrored -> ExifInterface.ORIENTATION_FLIP_VERTICAL
      rotationDegrees == 270 && mirrored -> ExifInterface.ORIENTATION_TRANSVERSE
      rotationDegrees == 90 && !mirrored -> ExifInterface.ORIENTATION_ROTATE_90
      rotationDegrees == 90 && mirrored -> ExifInterface.ORIENTATION_TRANSPOSE
      rotationDegrees == 270 && mirrored -> ExifInterface.ORIENTATION_ROTATE_270
      rotationDegrees == 270 && !mirrored -> ExifInterface.ORIENTATION_TRANSVERSE
      else -> ExifInterface.ORIENTATION_UNDEFINED
    }
  }
}
