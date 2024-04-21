package com.mrousavy.camera.core.utils

import android.content.Context
import android.graphics.Bitmap
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
  }
}
