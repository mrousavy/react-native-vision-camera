package com.margelo.nitro.camera.extensions

import androidx.camera.core.CameraInfo

val CameraInfo.zoomLensSwitchFactors: DoubleArray
  get() {
    // TODO: This currently crashes with:
    //       "java.lang.UnsupportedOperationException: Physical camera doesn't support this function"
    //       We need to figure out if there's a different way to get this
    return doubleArrayOf()
    // val nextPhysicalCameras = physicalCameraInfos.drop(1)
    // if (nextPhysicalCameras.isEmpty()) {
    //   // not a multi-cam
    //   return doubleArrayOf()
    // }
    // val zoomSwitchFactors =
    //   nextPhysicalCameras.map {
    //     it.zoomState.value
    //       ?.minZoomRatio
    //       ?.toDouble() ?: 0.0
    //   }
    // return zoomSwitchFactors.toDoubleArray()
  }
