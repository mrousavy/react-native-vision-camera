package com.mrousavy.camera.core

import android.media.AudioManager
import com.mrousavy.camera.core.extensions.takePicture
import com.mrousavy.camera.core.types.Flash
import com.mrousavy.camera.core.types.Orientation
import com.mrousavy.camera.core.types.TakePhotoOptions
import com.mrousavy.camera.core.utils.FileUtils

import androidx.camera.core.ImageCapture.OnImageCapturedCallback
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import android.os.Looper
import android.util.Log
import android.provider.MediaStore
import android.content.ContentValues
import java.io.File
import android.os.Environment
import java.io.FileOutputStream
import androidx.core.content.ContextCompat
import androidx.camera.core.ImageCapture.Metadata
import androidx.camera.core.internal.compat.workaround.ExifRotationAvailability
import android.media.MediaActionSound
import androidx.exifinterface.media.ExifInterface

fun isOnMainThread() = Looper.myLooper() == Looper.getMainLooper()
fun ensureBackgroundThread(callback: () -> Unit) {
  if (isOnMainThread()) {
    Thread {
      callback()
    }.start()
  } else {
    callback()
  }
}

val TAG = "CameraSession+Photo"

suspend fun CameraSession.takePhoto(options: TakePhotoOptions): Photo {
  val camera = camera ?: throw CameraNotReadyError()
  val configuration = configuration ?: throw CameraNotReadyError()
  val photoConfig = configuration.photo as? CameraConfiguration.Output.Enabled<CameraConfiguration.Photo> ?: throw PhotoNotEnabledError()
  val photoOutput = photoOutput ?: throw PhotoNotEnabledError()

  if (options.flash != Flash.OFF && !camera.cameraInfo.hasFlashUnit()) {
    throw FlashUnavailableError()
  }
  photoOutput.flashMode = options.flash.toFlashMode()

  val enableShutterSound = options.enableShutterSound && !audioManager.isSilent
  val shutterSound = if (enableShutterSound) MediaActionSound() else null
  shutterSound?.load(MediaActionSound.SHUTTER_CLICK)

  val isMirrored = photoConfig.config.isMirrored
  val metadata = Metadata().apply {
    isReversedHorizontal = isMirrored
  }

  var capturedAt = System.currentTimeMillis();
  val filename = "img_${capturedAt}.jpg"
  photoOutput.takePicture(CameraQueues.cameraExecutor, object : OnImageCapturedCallback() {
    override fun onCaptureSuccess(image: ImageProxy) {
      ensureBackgroundThread {
        if (enableShutterSound) {
          shutterSound?.play(MediaActionSound.SHUTTER_CLICK)
        }

        val directory = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "Light")
        if (!directory.exists()) {
          directory.mkdirs()
        }

        // Create file with timestamp
        val file = File(directory, filename)

        try {
          val buffer = image.planes[0].buffer
          val bytes = ByteArray(buffer.remaining()).apply {
            buffer.get(this)
          }
          FileOutputStream(file).use { output ->
            output.write(bytes)
          }

          // Add the image to MediaStore so it appears in the gallery
          val values = ContentValues().apply {
            put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
            put(MediaStore.Images.Media.DATE_ADDED, capturedAt / 1000)
            put(MediaStore.Images.Media.DATE_TAKEN, capturedAt)
            put(MediaStore.Images.Media.DATA, file.absolutePath)
          }

          context.contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
          Log.i(TAG, "Image saved successfully to: ${file.absolutePath}, height: ${image.height}, width: ${image.width}, format: ${image.format}")

          val exif = ExifInterface(file.absolutePath)
          // Overwrite the original orientation if the quirk exists.
          if (!ExifRotationAvailability().shouldUseExifOrientation(image)) {
            exif.rotate(image.imageInfo.rotationDegrees)
          }
          if (metadata.isReversedHorizontal) {
            exif.flipHorizontally()
          }
          if (metadata.isReversedVertical) {
            exif.flipVertically()
          }
          exif.saveAttributes();
          Log.i(TAG, "EXIF data saved")
        } catch (e: Exception) {
          Log.e(TAG, "Error saving image: ${e.message}")
          e.printStackTrace()
        }
      }
    }

    override fun onError(exception: ImageCaptureException) {
      Log.d(TAG, "onError: ${exception.message}")
    }
  })

  return Photo(
    "/storage/emulated/0/Pictures/Light/${filename}",
    0,
    0,
    Orientation.fromSurfaceRotation(photoOutput.targetRotation),
    isMirrored
  )
}

private val AudioManager.isSilent: Boolean
  get() = ringerMode != AudioManager.RINGER_MODE_NORMAL
