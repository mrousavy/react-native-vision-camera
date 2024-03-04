package com.mrousavy.camera

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import android.graphics.Matrix
import android.hardware.camera2.*
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.mrousavy.camera.core.CameraSession
import com.mrousavy.camera.core.InsufficientStorageError
import com.mrousavy.camera.types.Flash
import com.mrousavy.camera.types.QualityPrioritization
import com.mrousavy.camera.utils.*
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import kotlinx.coroutines.*

private const val TAG = "CameraView.takePhoto"

@SuppressLint("UnsafeOptInUsageError")
suspend fun CameraView.takePhoto(optionsMap: ReadableMap): WritableMap {
  val options = optionsMap.toHashMap()
  Log.i(TAG, "Taking photo... Options: $options")

  val qualityPrioritization = options["qualityPrioritization"] as? String ?: "balanced"
  val flash = options["flash"] as? String ?: "off"
  val enableAutoStabilization = options["enableAutoStabilization"] == true
  val enableShutterSound = options["enableShutterSound"] as? Boolean ?: true
  val enablePrecapture = options["enablePrecapture"] as? Boolean ?: false

  // TODO: Implement Red Eye Reduction
  options["enableAutoRedEyeReduction"]

  val flashMode = Flash.fromUnionValue(flash)
  val qualityPrioritizationMode = QualityPrioritization.fromUnionValue(qualityPrioritization)

  val photo = cameraSession.takePhoto(
    qualityPrioritizationMode,
    flashMode,
    enableShutterSound,
    enableAutoStabilization,
    enablePrecapture,
    orientation
  )

  photo.use {
    Log.i(TAG, "Successfully captured ${photo.image.width} x ${photo.image.height} photo!")

    val cameraCharacteristics = cameraManager.getCameraCharacteristics(cameraId!!)

    val path = try {
      savePhotoToFile(context, cameraCharacteristics, photo)
    } catch (e: IOException) {
      if (e.message?.contains("no space left", true) == true) {
        throw InsufficientStorageError()
      } else {
        throw e
      }
    }

    Log.i(TAG, "Successfully saved photo to file! $path")

    val map = Arguments.createMap()
    map.putString("path", path)
    map.putInt("width", photo.image.width)
    map.putInt("height", photo.image.height)
    map.putString("orientation", photo.orientation.unionValue)
    map.putBoolean("isRawPhoto", photo.format == ImageFormat.RAW_SENSOR)
    map.putBoolean("isMirrored", photo.isMirrored)

    return map
  }
}

private fun writePhotoToFile(photo: CameraSession.CapturedPhoto, file: File) {
  val byteBuffer = photo.image.planes[0].buffer
  if (photo.isMirrored) {
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
    val channel = FileOutputStream(file).channel
    channel.write(byteBuffer)
    channel.close()
  }
}

private suspend fun savePhotoToFile(
  context: Context,
  cameraCharacteristics: CameraCharacteristics,
  photo: CameraSession.CapturedPhoto
): String =
  withContext(Dispatchers.IO) {
    when (photo.format) {
      // When the format is JPEG or DEPTH JPEG we can simply save the bytes as-is
      ImageFormat.JPEG, ImageFormat.DEPTH_JPEG -> {
        val file = FileUtils.createTempFile(context, ".jpg")
        writePhotoToFile(photo, file)
        return@withContext file.absolutePath
      }

      // When the format is RAW we use the DngCreator utility library
      ImageFormat.RAW_SENSOR -> {
        val dngCreator = DngCreator(cameraCharacteristics, photo.metadata)
        val file = FileUtils.createTempFile(context, ".dng")
        FileOutputStream(file).use { stream ->
          // TODO: Make sure orientation is loaded properly here?
          dngCreator.writeImage(stream, photo.image)
        }
        return@withContext file.absolutePath
      }

      else -> {
        throw Error("Failed to save Photo to file, image format is not supported! ${photo.format}")
      }
    }
  }
