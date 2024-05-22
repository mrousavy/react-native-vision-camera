package com.mrousavy.camera.core.utils

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import com.mrousavy.camera.core.InvalidPathError
import java.io.File
import java.io.FileOutputStream

class FileUtils {
  companion object {
    fun createTempFile(context: Context, extension: String): File =
      File.createTempFile("mrousavy-", extension, context.cacheDir).also {
        it.deleteOnExit()
      }

    fun writeBitmapTofile(bitmap: Bitmap, file: File, quality: Int) {
      FileOutputStream(file).use { stream ->
        bitmap.compress(Bitmap.CompressFormat.JPEG, quality, stream)
      }
    }

    fun getDestinationFile(context: Context, path: String?, fileExtension: String): File {
      val destinationPath = Uri.parse(path).path
      if (destinationPath != null) {
        val destinationFile = File(destinationPath)
        // Check if the directory exists
        if (!destinationFile.parentFile.exists()) {
          throw InvalidPathError("Directory does not exist: ${destinationFile.parentFile.path}")
        }
        // Check if the directory is a directory
        if (!destinationFile.parentFile.isDirectory) {
          throw InvalidPathError("Path directory is not a directory: ${destinationFile.parentFile.path}")
        }
        // Check if the directory is readable and writable
        if (!destinationFile.parentFile.canRead() || !destinationFile.parentFile.canWrite()) {
          throw InvalidPathError("Path directory is not readable or writable: ${destinationFile.parentFile.path}")
        }
        // Check if the path doesn't exist
        if (destinationFile.exists()) {
          throw InvalidPathError("File already exists at path: $path")
        }
        return destinationFile
      } else {
        return createTempFile(context, fileExtension)
      }
    }
  }
}
