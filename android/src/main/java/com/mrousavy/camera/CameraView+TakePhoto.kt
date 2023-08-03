package com.mrousavy.camera

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.ImageFormat
import android.hardware.camera2.*
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.mrousavy.camera.utils.*
import kotlinx.coroutines.*
import java.io.File
import java.io.FileOutputStream

@SuppressLint("UnsafeOptInUsageError")
suspend fun CameraView.takePhoto(optionsMap: ReadableMap): WritableMap = coroutineScope {
  // TODO: takePhoto()
  val options = optionsMap.toHashMap()

  val qualityPrioritization = options["qualityPrioritization"] as? String
  val flash = options["flash"] as? String
  val enableAutoRedEyeReduction = options["enableAutoRedEyeReduction"] == true
  val enableAutoStabilization = options["enableAutoStabilization"] == true
  val skipMetadata = options["skipMetadata"] == true

  val flashMode = when (flash) {
    "off" -> FlashMode.OFF
    "on" -> FlashMode.ON
    "auto" -> FlashMode.AUTO
    else -> FlashMode.AUTO
  }
  val qualityPrioritizationMode = when (qualityPrioritization) {
    "speed" -> QualityPrioritization.SPEED
    "balanced" -> QualityPrioritization.BALANCED
    "quality" -> QualityPrioritization.QUALITY
    else -> QualityPrioritization.BALANCED
  }

  val photo = cameraSession.takePhoto(qualityPrioritizationMode,
                                      flashMode,
                                      enableAutoRedEyeReduction,
                                      enableAutoStabilization)

  val cameraCharacteristics = cameraManager.getCameraCharacteristics(cameraId!!)

  val path = savePhotoToFile(context, cameraCharacteristics, photo)

  val map = Arguments.createMap()
  map.putString("path", path)
  map.putInt("width", photo.image.width)
  map.putInt("height", photo.image.height)
  map.putBoolean("isRawPhoto", photo.format == ImageFormat.RAW_SENSOR)

  // TODO: Add metadata prop to resulting photo

  return@coroutineScope map
}

private suspend fun savePhotoToFile(context: Context,
                                    cameraCharacteristics: CameraCharacteristics,
                                    photo: CameraSession.CapturedPhoto): String {
  return withContext(Dispatchers.IO) {
    when (photo.format) {
      // When the format is JPEG or DEPTH JPEG we can simply save the bytes as-is
      ImageFormat.JPEG, ImageFormat.DEPTH_JPEG -> {
        val buffer = photo.image.planes[0].buffer
        val bytes = ByteArray(buffer.remaining()).apply { buffer.get(this) }
        val file = createFile(context, "jpg")
        FileOutputStream(file).use { stream ->
          stream.write(bytes)
        }
        return@withContext file.absolutePath
      }

      // When the format is RAW we use the DngCreator utility library
      ImageFormat.RAW_SENSOR -> {
        val dngCreator = DngCreator(cameraCharacteristics, photo.metadata)
        val file = createFile(context, "dng")
        FileOutputStream(file).use { stream ->
          dngCreator.writeImage(stream, photo.image)
        }
        return@withContext file.absolutePath
      }

      else -> {
        throw Error("Failed to save Photo to file, image format is not supported! ${photo.format}")
      }
    }
  }
}

private fun createFile(context: Context, extension: String): File {
  return File.createTempFile("mrousavy", extension, context.cacheDir).apply { deleteOnExit() }
}
