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
import com.mrousavy.camera.core.InsufficientStorageError
import com.mrousavy.camera.core.Photo
import com.mrousavy.camera.types.Flash
import com.mrousavy.camera.types.QualityBalance
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

  // TODO: Implement Red Eye Reduction
  options["enableAutoRedEyeReduction"]

  val flashMode = Flash.fromUnionValue(flash)
  val qualityBalanceMode = QualityBalance.fromUnionValue(qualityPrioritization)

  val photo = cameraSession.takePhoto(
    qualityBalanceMode,
    flashMode,
    enableShutterSound,
    enableAutoStabilization,
    orientation
  )

  photo.use {
    Log.i(TAG, "Successfully captured ${photo.image.width} x ${photo.image.height} photo!")

    val path = try {
      savePhotoToFile(context, photo)
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
    map.putBoolean("isRawPhoto", photo.isRawPhoto)
    map.putBoolean("isMirrored", photo.isMirrored)

    return map
  }
}

private suspend fun savePhotoToFile(context: Context, photo: Photo): String =
  withContext(Dispatchers.IO) {
    when (photo.image.format) {
      ImageFormat.JPEG, ImageFormat.DEPTH_JPEG -> {
        // When the format is JPEG or DEPTH JPEG we can simply save the bytes as-is
        val file = FileUtils.createTempFile(context, ".jpg")
        FileUtils.writePhotoToFile(photo, file)
        return@withContext file.absolutePath
      }
      ImageFormat.RAW_SENSOR -> {
        // When the format is RAW we use the DngCreator utility library
        throw Error("Writing RAW photos is currently not supported!")
        // TODO: Write RAW photos using DngCreator?
        /**
         val dngCreator = DngCreator(cameraCharacteristics, photo.metadata)
         val file = FileUtils.createTempFile(context, ".dng")
         FileOutputStream(file).use { stream ->
         dngCreator.writeImage(stream, photo.image.image)
         }
         return@withContext file.absolutePath
         */
      }
      else -> {
        throw Error("Failed to save Photo to file, image format is not supported! ${photo.image.format}")
      }
    }
  }
