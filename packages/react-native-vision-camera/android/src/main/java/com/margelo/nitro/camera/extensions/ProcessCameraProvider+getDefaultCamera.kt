package com.margelo.nitro.camera.extensions

import androidx.annotation.OptIn
import androidx.camera.core.CameraInfo
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalLensFacing
import androidx.camera.lifecycle.ProcessCameraProvider
import com.margelo.nitro.camera.TargetCameraPosition

@OptIn(ExperimentalLensFacing::class)
fun ProcessCameraProvider.getDefaultCamera(position: TargetCameraPosition): CameraInfo {
  val selector =
    when (position) {
      TargetCameraPosition.FRONT -> CameraSelector.DEFAULT_FRONT_CAMERA
      TargetCameraPosition.BACK -> CameraSelector.DEFAULT_BACK_CAMERA
      TargetCameraPosition.EXTERNAL ->
        CameraSelector
          .Builder()
          .requireLensFacing(CameraSelector.LENS_FACING_EXTERNAL)
          .build()
    }
  return getCameraInfo(selector)
}
