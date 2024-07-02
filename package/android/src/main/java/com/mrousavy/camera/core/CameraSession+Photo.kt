package com.mrousavy.camera.core

import android.media.AudioManager
import android.util.Log
import com.mrousavy.camera.core.extensions.takePicture
import com.mrousavy.camera.core.types.Flash
import com.mrousavy.camera.core.types.Orientation
import com.mrousavy.camera.core.utils.FileUtils

suspend fun CameraSession.takePhoto(flash: Flash, enableShutterSound: Boolean): Photo {
  val camera = camera ?: throw CameraNotReadyError()
  val configuration = configuration ?: throw CameraNotReadyError()
  val photoConfig = configuration.photo as? CameraConfiguration.Output.Enabled<CameraConfiguration.Photo> ?: throw PhotoNotEnabledError()
  val photoOutput = photoOutput ?: throw PhotoNotEnabledError()

  if (flash != Flash.OFF && !camera.cameraInfo.hasFlashUnit()) {
    throw FlashUnavailableError()
  }

  photoOutput.flashMode = flash.toFlashMode()
  val enableShutterSoundActual = getEnableShutterSoundActual(enableShutterSound)

  val isMirrored = photoConfig.config.isMirrored
  val photoFile = photoOutput.takePicture(
    context,
    isMirrored,
    enableShutterSoundActual,
    metadataProvider,
    callback,
    CameraQueues.cameraExecutor
  )

  val size = FileUtils.getImageSize(photoFile.uri.path)
  val rotation = photoOutput.targetRotation
  val orientation = Orientation.fromSurfaceRotation(rotation)

  return Photo(photoFile.uri.path, size.width, size.height, orientation, isMirrored)
}

private fun CameraSession.getEnableShutterSoundActual(enable: Boolean): Boolean {
  if (enable && audioManager.ringerMode != AudioManager.RINGER_MODE_NORMAL) {
    Log.i(CameraSession.TAG, "Ringer mode is silent (${audioManager.ringerMode}), disabling shutter sound...")
    return false
  }

  return enable
}
