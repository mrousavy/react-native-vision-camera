package com.margelo.nitro.camera.extensions

import androidx.camera.core.CameraInfo
import com.margelo.nitro.camera.CameraSessionConnection
import com.margelo.nitro.camera.public.NativeCameraDevice

fun CameraSessionConnection.getCameraInfo(): CameraInfo {
  val cameraDevice =
    input as? NativeCameraDevice
      ?: throw Error("CameraDevice $input is not of type `NativeCameraDevice`!")
  return cameraDevice.cameraInfo
}
