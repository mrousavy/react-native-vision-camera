package com.mrousavy.camera.core

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.AudioManager
import android.util.Log
import androidx.exifinterface.media.ExifInterface
import com.mrousavy.camera.core.extensions.takePicture
import com.mrousavy.camera.core.types.Flash
import com.mrousavy.camera.core.types.Orientation
import com.mrousavy.camera.core.types.TakePhotoOptions
import com.mrousavy.camera.core.utils.FileUtils
import com.mrousavy.camera.core.utils.runOnUiThread
import java.io.File
import java.io.FileOutputStream

suspend fun CameraSession.takePhoto(options: TakePhotoOptions): Photo {
  val camera = camera ?: throw CameraNotReadyError()
  val configuration = configuration ?: throw CameraNotReadyError()
  val photoConfig = configuration.photo as? CameraConfiguration.Output.Enabled<CameraConfiguration.Photo> ?: throw PhotoNotEnabledError()
  val photoOutput = photoOutput ?: throw PhotoNotEnabledError()

  // Flash
  if (options.flash != Flash.OFF && !camera.cameraInfo.hasFlashUnit()) {
    throw FlashUnavailableError()
  }
  photoOutput.flashMode = options.flash.toFlashMode()
  // Shutter sound
  val enableShutterSound = options.enableShutterSound && !audioManager.isSilent
  // isMirrored (EXIF)
  val isMirrored = photoConfig.config.isMirrored

  // Shoot photo!
  val photoFile = photoOutput.takePicture(
    options.file.file,
    isMirrored,
    enableShutterSound,
    metadataProvider,
    callback,
    CameraQueues.cameraExecutor
  )

  // Generate thumbnail if requested (async, non-blocking)
  if (options.thumbnailSize != null) {
    CameraQueues.cameraExecutor.execute {
      try {
        generateThumbnailSync(photoFile.uri.path, options.thumbnailSize)
      } catch (e: Exception) {
        Log.e("CameraSession", "Failed to generate thumbnail", e)
      }
    }
  }

  // Parse resulting photo (EXIF data)
  val size = FileUtils.getImageSize(photoFile.uri.path)
  val rotation = photoOutput.targetRotation
  val orientation = Orientation.fromSurfaceRotation(rotation)

  return Photo(photoFile.uri.path, size.width, size.height, orientation, isMirrored)
}

private fun CameraSession.generateThumbnailSync(photoPath: String, thumbnailSize: TakePhotoOptions.Size) {
  try {
    val photoFile = File(photoPath)
    if (!photoFile.exists()) {
      Log.w("CameraSession", "Photo file not found for thumbnail generation")
      return
    }

    // Read EXIF orientation
    val exif = ExifInterface(photoFile)
    val orientation = exif.getAttributeInt(
      ExifInterface.TAG_ORIENTATION,
      ExifInterface.ORIENTATION_NORMAL
    )

    // Decode image with inSampleSize for memory efficiency
    val options = BitmapFactory.Options().apply {
      inJustDecodeBounds = true
    }
    BitmapFactory.decodeFile(photoPath, options)

    // Calculate inSampleSize
    val maxSize = maxOf(thumbnailSize.width, thumbnailSize.height)
    val imageSize = maxOf(options.outWidth, options.outHeight)
    var inSampleSize = 1
    while (imageSize / inSampleSize > maxSize) {
      inSampleSize *= 2
    }

    // Decode bitmap with sample size
    options.inJustDecodeBounds = false
    options.inSampleSize = inSampleSize
    var bitmap = BitmapFactory.decodeFile(photoPath, options)
      ?: run {
        Log.w("CameraSession", "Failed to decode photo for thumbnail")
        return
      }

    // Apply EXIF orientation
    bitmap = when (orientation) {
      ExifInterface.ORIENTATION_ROTATE_90 -> rotateBitmap(bitmap, 90f)
      ExifInterface.ORIENTATION_ROTATE_180 -> rotateBitmap(bitmap, 180f)
      ExifInterface.ORIENTATION_ROTATE_270 -> rotateBitmap(bitmap, 270f)
      else -> bitmap
    }

    // Scale to target size maintaining aspect ratio
    val scale = minOf(
      thumbnailSize.width.toFloat() / bitmap.width,
      thumbnailSize.height.toFloat() / bitmap.height
    )
    val scaledWidth = (bitmap.width * scale).toInt()
    val scaledHeight = (bitmap.height * scale).toInt()
    val scaledBitmap = Bitmap.createScaledBitmap(bitmap, scaledWidth, scaledHeight, true)
    if (scaledBitmap != bitmap) {
      bitmap.recycle()
    }

    // Save thumbnail to temp file
    val thumbnailFile = File(photoFile.parent, "thumbnail_${photoFile.name}")
    FileOutputStream(thumbnailFile).use { out ->
      scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 80, out)
    }
    scaledBitmap.recycle()

    // Invoke callback on main thread
    runOnUiThread {
      callback.onThumbnailReady(thumbnailFile.absolutePath, scaledWidth, scaledHeight)
    }

    Log.i("CameraSession", "Thumbnail generated: ${thumbnailFile.absolutePath}")
  } catch (e: Exception) {
    Log.e("CameraSession", "Error generating thumbnail", e)
  }
}

private fun rotateBitmap(source: Bitmap, degrees: Float): Bitmap {
  val matrix = Matrix().apply { postRotate(degrees) }
  val rotated = Bitmap.createBitmap(source, 0, 0, source.width, source.height, matrix, true)
  if (rotated != source) {
    source.recycle()
  }
  return rotated
}

private val AudioManager.isSilent: Boolean
  get() = ringerMode != AudioManager.RINGER_MODE_NORMAL
