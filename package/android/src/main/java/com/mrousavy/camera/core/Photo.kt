package com.mrousavy.camera.core

import android.graphics.ImageFormat
import androidx.camera.core.ImageProxy
import com.mrousavy.camera.types.Orientation
import java.io.Closeable

data class Photo(
  val image: ImageProxy,
  val isMirrored: Boolean,
) : Closeable {
  val orientation: Orientation
    get() = Orientation.fromRotationDegrees(image.imageInfo.rotationDegrees)
  val isRawPhoto
    get() = image.format in listOf(ImageFormat.RAW_SENSOR, ImageFormat.RAW10, ImageFormat.RAW12, ImageFormat.RAW_PRIVATE)

  override fun close() {
    image.close()
  }
}
