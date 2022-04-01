package com.mrousavy.camera

import android.graphics.Bitmap
import androidx.exifinterface.media.ExifInterface
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.mrousavy.camera.utils.buildMetadataMap
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import kotlinx.coroutines.guava.await

suspend fun CameraView.takeSnapshot(options: ReadableMap): WritableMap = coroutineScope {
  val camera = camera ?: throw com.mrousavy.camera.CameraNotReadyError()
  val enableFlash = options.getString("flash") == "on"

  try {
    if (enableFlash) {
      camera.cameraControl.enableTorch(true).await()
    }

    val bitmap = withContext(coroutineScope.coroutineContext) {
      previewView.bitmap ?: throw CameraNotReadyError()
    }

    val quality = if (options.hasKey("quality")) options.getInt("quality") else 100

    val file: File
    val exif: ExifInterface
    @Suppress("BlockingMethodInNonBlockingContext")
    withContext(Dispatchers.IO) {
      file = File.createTempFile("mrousavy", ".jpg", context.cacheDir).apply { deleteOnExit() }
      FileOutputStream(file).use { stream ->
        bitmap.compress(Bitmap.CompressFormat.JPEG, quality, stream)
      }
      exif = ExifInterface(file)
    }

    val map = Arguments.createMap()
    map.putString("path", file.absolutePath)
    map.putInt("width", bitmap.width)
    map.putInt("height", bitmap.height)
    map.putBoolean("isRawPhoto", false)

    val skipMetadata =
      if (options.hasKey("skipMetadata")) options.getBoolean("skipMetadata") else false
    val metadata = if (skipMetadata) null else exif.buildMetadataMap()
    map.putMap("metadata", metadata)

    return@coroutineScope map
  } finally {
    if (enableFlash) {
      // reset to `torch` property
      camera.cameraControl.enableTorch(this@takeSnapshot.torch == "on")
    }
  }
}
