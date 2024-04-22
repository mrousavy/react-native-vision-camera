package com.mrousavy.camera.core.extensions

import androidx.camera.core.CameraSelector

fun CameraSelector.Builder.byId(id: String): CameraSelector.Builder =
  addCameraFilter { cameraInfos ->
    cameraInfos.filter { it.id == id }.toMutableList()
  }
