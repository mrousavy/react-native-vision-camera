package com.mrousavy.camera.utils

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import android.graphics.Matrix
import android.util.Log
import androidx.camera.core.ImageProxy
import androidx.exifinterface.media.ExifInterface
import com.mrousavy.camera.CameraView
import com.mrousavy.camera.InvalidFormatError
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer
import kotlin.system.measureTimeMillis

// TODO: Fix this flip() function (this outputs a black image)
fun flip(imageBytes: ByteArray, imageWidth: Int): ByteArray {
  // separate out the sub arrays
  var holder = ByteArray(imageBytes.size)
  var subArray = ByteArray(imageWidth)
  var subCount = 0
  for (i in imageBytes.indices) {
    subArray[subCount] = imageBytes[i]
    subCount++
    if (i % imageWidth == 0) {
      subArray.reverse()
      if (i == imageWidth) {
        holder = subArray
      } else {
        holder += subArray
      }
      subCount = 0
      subArray = ByteArray(imageWidth)
    }
  }
  subArray = ByteArray(imageWidth)
  System.arraycopy(imageBytes, imageBytes.size - imageWidth, subArray, 0, subArray.size)
  return holder + subArray
}

// TODO: This function is slow. Figure out a faster way to flip images, preferably via directly manipulating the byte[] Exif flags
fun flipImage(imageBytes: ByteArray): ByteArray {
  val bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
  val matrix = Matrix()

  val exif = ExifInterface(imageBytes.inputStream())
  val orientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_UNDEFINED)

  when (orientation) {
    ExifInterface.ORIENTATION_ROTATE_180 -> {
      matrix.setRotate(180f)
      matrix.postScale(-1f, 1f)
    }
    ExifInterface.ORIENTATION_FLIP_VERTICAL -> {
      matrix.setRotate(180f)
    }
    ExifInterface.ORIENTATION_TRANSPOSE -> {
      matrix.setRotate(90f)
    }
    ExifInterface.ORIENTATION_ROTATE_90 -> {
      matrix.setRotate(90f)
      matrix.postScale(-1f, 1f)
    }
    ExifInterface.ORIENTATION_TRANSVERSE -> {
      matrix.setRotate(-90f)
    }
    ExifInterface.ORIENTATION_ROTATE_270 -> {
      matrix.setRotate(-90f)
      matrix.postScale(-1f, 1f)
    }
  }

  val newBitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
  val stream = ByteArrayOutputStream()
  newBitmap.compress(Bitmap.CompressFormat.JPEG, 100, stream)
  return stream.toByteArray()
}

fun ImageProxy.save(file: File, flipHorizontally: Boolean) {
  when (format) {
    // TODO: ImageFormat.RAW_SENSOR
    // TODO: ImageFormat.DEPTH_JPEG
    ImageFormat.JPEG -> {
      val buffer = planes[0].buffer
      var bytes = ByteArray(buffer.remaining())

      // copy image from buffer to byte array
      buffer.get(bytes)

      if (flipHorizontally) {
        val milliseconds = measureTimeMillis {
          bytes = flipImage(bytes)
        }
        Log.i(CameraView.TAG_PERF, "Flipping Image took $milliseconds ms.")
      }

      val output = FileOutputStream(file)
      output.write(bytes)
      output.close()
    }
    ImageFormat.YUV_420_888 -> {
      // "prebuffer" simply contains the meta information about the following planes.
      val prebuffer = ByteBuffer.allocate(16)
      prebuffer.putInt(width)
        .putInt(height)
        .putInt(planes[1].pixelStride)
        .putInt(planes[1].rowStride)

      val output = FileOutputStream(file)
      output.write(prebuffer.array()) // write meta information to file
      // Now write the actual planes.
      var buffer: ByteBuffer
      var bytes: ByteArray

      for (i in 0..2) {
        buffer = planes[i].buffer
        bytes = ByteArray(buffer.remaining()) // makes byte array large enough to hold image
        buffer.get(bytes) // copies image from buffer to byte array
        output.write(bytes) // write the byte array to file
      }
      output.close()
    }
    else -> throw InvalidFormatError(format)
  }
}
