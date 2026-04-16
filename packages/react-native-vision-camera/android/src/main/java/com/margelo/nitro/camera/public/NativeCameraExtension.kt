package com.margelo.nitro.camera.public

import androidx.camera.core.CameraInfo
import androidx.camera.core.CameraSelector
import com.margelo.nitro.camera.CameraExtensionType

public interface NativeCameraExtension {
  val cameraInfo: CameraInfo
  val supportsFrameStreaming: Boolean
  val type: CameraExtensionType

  fun getExtensionEnabledCameraSelector(): CameraSelector
}
