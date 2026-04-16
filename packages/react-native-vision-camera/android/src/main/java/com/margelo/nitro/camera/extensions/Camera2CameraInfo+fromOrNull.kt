package com.margelo.nitro.camera.extensions

import android.util.Log
import androidx.annotation.OptIn
import androidx.camera.camera2.interop.Camera2CameraInfo
import androidx.camera.core.CameraInfo

@OptIn(androidx.camera.camera2.interop.ExperimentalCamera2Interop::class)
fun Camera2CameraInfo.Companion.fromSafe(cameraInfo: CameraInfo): Camera2CameraInfo? {
  try {
    return Camera2CameraInfo.from(cameraInfo)
  } catch (e: Throwable) {
    Log.w("VisionCamera", "Camera Device $cameraInfo is not a Camera2 device!")
    return null
  }
}
