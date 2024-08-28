package com.mrousavy.camera.core.extensions

import android.annotation.SuppressLint
import android.media.MediaActionSound
import android.util.Log
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCapture.OutputFileOptions
import androidx.camera.core.ImageCaptureException
import com.mrousavy.camera.core.CameraSession
import com.mrousavy.camera.core.MetadataProvider
import com.mrousavy.camera.core.types.ShutterType
import java.io.File
import java.net.URI
import java.util.concurrent.Executor
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.suspendCancellableCoroutine

data class PhotoFileInfo(val uri: URI, val metadata: ImageCapture.Metadata)

@SuppressLint("RestrictedApi")
suspend inline fun ImageCapture.takePicture(
  file: File,
  isMirrored: Boolean,
  enableShutterSound: Boolean,
  metadataProvider: MetadataProvider,
  callback: CameraSession.Callback,
  executor: Executor
): PhotoFileInfo =
  suspendCancellableCoroutine { continuation ->
    // Shutter sound
    val shutterSound = if (enableShutterSound) MediaActionSound() else null
    shutterSound?.load(MediaActionSound.SHUTTER_CLICK)

    // Create output file
    val outputFileOptionsBuilder = OutputFileOptions.Builder(file).also { options ->
      val metadata = ImageCapture.Metadata()
      metadataProvider.location?.let { location ->
        Log.i("ImageCapture", "Setting Photo Location to ${location.latitude}, ${location.longitude}...")
        metadata.location = metadataProvider.location
      }
      metadata.isReversedHorizontal = isMirrored
      options.setMetadata(metadata)
    }
    val outputFileOptions = outputFileOptionsBuilder.build()

    // Take a photo with callbacks
    takePicture(
      outputFileOptions,
      executor,
      object : ImageCapture.OnImageSavedCallback {
        override fun onCaptureStarted() {
          super.onCaptureStarted()
          if (enableShutterSound) {
            shutterSound?.play(MediaActionSound.SHUTTER_CLICK)
          }

          callback.onShutter(ShutterType.PHOTO)
        }

        @SuppressLint("RestrictedApi")
        override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
          if (continuation.isActive) {
            val info = PhotoFileInfo(file.toURI(), outputFileOptions.metadata)
            continuation.resume(info)
          }
        }

        override fun onError(exception: ImageCaptureException) {
          if (continuation.isActive) {
            continuation.resumeWithException(exception)
          }
        }
      }
    )
  }
