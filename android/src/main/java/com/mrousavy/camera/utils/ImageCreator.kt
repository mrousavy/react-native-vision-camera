package com.mrousavy.camera.utils

import android.graphics.ImageFormat
import android.media.Image
import android.media.ImageReader
import android.media.ImageWriter
import java.io.Closeable

class ImageCreator(private val width: Int,
                   private val height: Int,
                   private val format: Int = ImageFormat.PRIVATE,
                   private val maxImages: Int = 3): Closeable {
  private var imageReader: ImageReader? = null
  private var imageWriter: ImageWriter? = null

  override fun close() {
    imageWriter?.close()
    imageReader?.close()
  }

  fun createImage(): Image {
    if (imageReader == null || imageWriter == null) {
      imageWriter?.close()
      imageReader?.close()

      imageReader = ImageReader.newInstance(width, height, format, maxImages)
      imageWriter = ImageWriter.newInstance(imageReader!!.surface, maxImages)
    }

    return imageWriter!!.dequeueInputImage()
  }
}
