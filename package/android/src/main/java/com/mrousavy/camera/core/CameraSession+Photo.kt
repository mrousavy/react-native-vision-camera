package com.mrousavy.camera.core

import android.media.AudioManager
import com.mrousavy.camera.core.extensions.takePicture
import com.mrousavy.camera.core.types.Flash
import com.mrousavy.camera.core.types.Orientation
import com.mrousavy.camera.core.types.TakePhotoOptions
import com.mrousavy.camera.core.utils.FileUtils

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

  // Parse resulting photo (EXIF data)
  val size = FileUtils.getImageSize(photoFile.uri.path)
  val rotation = photoOutput.targetRotation
  val orientation = Orientation.fromSurfaceRotation(rotation)

  return Photo(photoFile.uri.path, size.width, size.height, orientation, isMirrored)
}

private val AudioManager.isSilent: Boolean
  get() = ringerMode != AudioManager.RINGER_MODE_NORMAL
