package com.mrousavy.camera.utils

import android.content.Context
import java.io.File

class FileUtils {
  companion object {
    fun createTempFile(context: Context, extension: String): File =
      File.createTempFile("mrousavy", extension, context.cacheDir).also {
        it.deleteOnExit()
      }
  }
}
