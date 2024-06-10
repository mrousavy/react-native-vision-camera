package com.mrousavy.camera.core.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Size
import java.io.File
import java.io.FileOutputStream

class FileUtils {
  companion object {
    fun createTempFile(context: Context, extension: String): File =
      File.createTempFile("mrousavy-", extension, context.cacheDir).also {
        it.deleteOnExit()
      }

    fun writeBitmapTofile(bitmap: Bitmap, file: File, quality: Int = 100) {
      FileOutputStream(file).use { stream ->
        bitmap.compress(Bitmap.CompressFormat.JPEG, quality, stream)
      }
    }

    fun getImageSize(imagePath: String): Size {
      val bitmapOptions = BitmapFactory.Options().also {
        it.inJustDecodeBounds = true
      }
      BitmapFactory.decodeFile(imagePath, bitmapOptions)
      val width = bitmapOptions.outWidth
      val height = bitmapOptions.outHeight
      return Size(width, height)
    }
  }
}
