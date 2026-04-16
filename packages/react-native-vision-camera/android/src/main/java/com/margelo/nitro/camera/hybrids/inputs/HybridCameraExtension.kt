package com.margelo.nitro.camera.hybrids.inputs

import androidx.camera.core.CameraInfo
import androidx.camera.core.CameraSelector
import androidx.camera.extensions.ExtensionMode
import androidx.camera.extensions.ExtensionsManager
import com.margelo.nitro.camera.CameraExtensionType
import com.margelo.nitro.camera.HybridCameraExtensionSpec
import com.margelo.nitro.camera.extensions.converters.fromExtensionMode
import com.margelo.nitro.camera.public.NativeCameraExtension

class HybridCameraExtension(
  override val cameraInfo: CameraInfo,
  private val extensionsManager: ExtensionsManager,
  @param:ExtensionMode.Mode val extensionMode: Int,
) : HybridCameraExtensionSpec(),
  NativeCameraExtension {
  override val type: CameraExtensionType
    get() = CameraExtensionType.fromExtensionMode(extensionMode)

  override val supportsFrameStreaming: Boolean
    get() = extensionsManager.isImageAnalysisSupported(cameraInfo.cameraSelector, extensionMode)

  override fun getExtensionEnabledCameraSelector(): CameraSelector {
    return extensionsManager.getExtensionEnabledCameraSelector(cameraInfo.cameraSelector, extensionMode)
  }
}
