package com.margelo.nitro.camera.extensions

import androidx.camera.core.CameraInfo
import androidx.camera.lifecycle.ProcessCameraProvider
import com.margelo.nitro.camera.CameraSessionConnection
import com.margelo.nitro.camera.public.NativeCameraDevice

fun CameraSessionConnection.getCameraInfo(provider: ProcessCameraProvider): CameraInfo {
  val cameraInfo =
    input.match(
      { deviceSpec ->
        // unwrap CameraInfo
        val device =
          deviceSpec as? NativeCameraDevice
            ?: throw Error("CameraDevice $input is not of type `NativeCameraDevice`!")
        return@match device.cameraInfo
      },
      { position ->
        // "back" | "front" | "external" -> CameraInfo
        return@match provider.getDefaultCamera(position)
      },
    )
  return cameraInfo
}
