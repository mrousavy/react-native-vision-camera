package com.margelo.nitro.camera.extensions

import androidx.camera.core.ImageProxy
import com.margelo.nitro.camera.CameraOrientation

val ImageProxy.orientation: CameraOrientation
  get() {
    val degrees = imageInfo.rotationDegrees
    return CameraOrientation.fromDegrees(degrees)
  }
