package com.mrousavy.camera.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import com.mrousavy.camera.core.InvalidImageTypeError
import com.mrousavy.camera.core.Photo
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer

class FileUtils {
  companion object {
    fun createTempFile(context: Context, extension: String): File =
      File.createTempFile("mrousavy-", extension, context.cacheDir).also {
        it.deleteOnExit()
      }

    private fun writeBufferToFile(byteBuffer: ByteBuffer, isMirrored: Boolean, file: File) {
      if (isMirrored) {
        val imageBytes = ByteArray(byteBuffer.remaining()).apply { byteBuffer.get(this) }
        val bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
        val matrix = Matrix()
        matrix.preScale(-1f, 1f)
        val processedBitmap =
          Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, false)
        FileOutputStream(file).use { stream ->
          processedBitmap.compress(Bitmap.CompressFormat.JPEG, 100, stream)
        }
      } else {
        FileOutputStream(file).use { stream ->
          stream.channel.write(byteBuffer)
        }
      }
    }

    fun writePhotoToFile(photo: Photo, file: File) {
      val plane = photo.image.planes[0] ?: throw InvalidImageTypeError()
      writeBufferToFile(plane.buffer, photo.isMirrored, file)
    }

    fun writeBitmapTofile(bitmap: Bitmap, file: File, quality: Int = 100) {
      FileOutputStream(file).use { stream ->
        bitmap.compress(Bitmap.CompressFormat.JPEG, quality, stream)
      }
    }
  }
}
