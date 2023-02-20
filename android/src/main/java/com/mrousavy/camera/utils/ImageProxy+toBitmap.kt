package com.mrousavy.camera.utils

import android.graphics.*
import androidx.camera.core.ImageProxy
import java.io.ByteArrayOutputStream

fun ImageProxy.toBitmap(): Bitmap {
  val yBuffer = planes[0].buffer // Y
  val vuBuffer = planes[2].buffer // VU

  val ySize = yBuffer.remaining()
  val vuSize = vuBuffer.remaining()

  val nv21 = ByteArray(ySize + vuSize)

  yBuffer.get(nv21, 0, ySize)
  vuBuffer.get(nv21, ySize, vuSize)

  val yuvImage = YuvImage(nv21, ImageFormat.NV21, this.width, this.height, null)
  val out = ByteArrayOutputStream()
  yuvImage.compressToJpeg(Rect(0, 0, yuvImage.width, yuvImage.height), 100, out)
  val imageBytes = out.toByteArray()
  return BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
}
