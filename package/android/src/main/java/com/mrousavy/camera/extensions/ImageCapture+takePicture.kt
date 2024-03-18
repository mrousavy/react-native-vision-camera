package com.mrousavy.camera.extensions

import android.annotation.SuppressLint
import android.content.Context
import android.media.MediaActionSound
import android.net.Uri
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCapture.OutputFileOptions
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import com.mrousavy.camera.core.CameraSession
import com.mrousavy.camera.types.ShutterType
import com.mrousavy.camera.utils.FileUtils
import java.util.concurrent.Executor
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.suspendCancellableCoroutine
import java.net.URI

data class PhotoFileInfo(val uri: URI, val metadata: ImageCapture.Metadata)

@SuppressLint("RestrictedApi")
suspend inline fun ImageCapture.takePicture(context: Context, enableShutterSound: Boolean, callback: CameraSession.Callback, executor: Executor): PhotoFileInfo =
  suspendCancellableCoroutine { continuation ->
    // Shutter sound
    val shutterSound = if (enableShutterSound) MediaActionSound() else null
    shutterSound?.load(MediaActionSound.SHUTTER_CLICK)

    val file = FileUtils.createTempFile(context, ".jpg")
    val outputFileOptionsBuilder = OutputFileOptions.Builder(file).also { options ->
      val metadata = ImageCapture.Metadata()
      metadata.isReversedHorizontal = camera?.isFrontFacing == true
      options.setMetadata(metadata)
    }
    val outputFileOptions = outputFileOptionsBuilder.build()

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
