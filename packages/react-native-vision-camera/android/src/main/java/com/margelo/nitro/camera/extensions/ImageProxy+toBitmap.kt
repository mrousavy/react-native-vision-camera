package com.margelo.nitro.camera.extensions

import android.graphics.Bitmap
import android.graphics.Matrix
import androidx.camera.core.ImageProxy
import com.margelo.nitro.camera.CameraOrientation

fun ImageProxy.toBitmap(
  orientation: CameraOrientation,
  isMirrored: Boolean,
): Bitmap {
  val originalBitmap = this.toBitmap()

  val matrix =
    Matrix().apply {
      if (isMirrored) {
        preScale(-1f, 1f)
      }
      if (orientation != CameraOrientation.UP) {
        postRotate(orientation.degrees.toFloat())
      }
    }
  if (matrix.isIdentity) {
    // No transforms needed! Just return
    return originalBitmap
  } else {
    // We need to transform the Bitmap
    val transformedBitmap = Bitmap.createBitmap(originalBitmap, 0, 0, originalBitmap.width, originalBitmap.height, matrix, false)
    originalBitmap.recycle()
    return transformedBitmap
  }
}
