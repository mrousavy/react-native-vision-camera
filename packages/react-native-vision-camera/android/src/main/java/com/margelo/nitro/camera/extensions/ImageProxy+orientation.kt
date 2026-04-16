package com.margelo.nitro.camera.extensions

import androidx.camera.core.ImageProxy
import com.margelo.nitro.camera.Orientation

val ImageProxy.orientation: Orientation
  get() {
    val degrees = imageInfo.rotationDegrees
    return Orientation.fromDegrees(degrees)
  }
