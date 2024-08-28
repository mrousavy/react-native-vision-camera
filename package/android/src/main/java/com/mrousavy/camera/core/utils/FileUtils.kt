package com.mrousavy.camera.core.utils

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Size
import com.mrousavy.camera.core.InvalidPathError
import java.io.File
import java.io.FileOutputStream

class FileUtils {
  companion object {
    fun getDirectory(path: String?): File {
      if (path == null) {
        throw InvalidPathError("null")
      }
      val file = File(path)
      if (!file.isDirectory) {
        throw InvalidPathError(path)
      }
      return file
    }

    fun writeBitmapTofile(bitmap: Bitmap, file: File, quality: Int) {
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
