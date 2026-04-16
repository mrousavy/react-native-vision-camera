package com.margelo.nitro.camera.extensions.converters

import androidx.camera.extensions.ExtensionMode
import com.margelo.nitro.camera.CameraExtensionType

fun CameraExtensionType.Companion.fromExtensionMode(
  @ExtensionMode.Mode mode: Int,
): CameraExtensionType {
  return when (mode) {
    ExtensionMode.AUTO -> CameraExtensionType.AUTO
    ExtensionMode.HDR -> CameraExtensionType.HDR
    ExtensionMode.NIGHT -> CameraExtensionType.NIGHT
    ExtensionMode.BOKEH -> CameraExtensionType.BOKEH
    ExtensionMode.FACE_RETOUCH -> CameraExtensionType.FACE_RETOUCH
    // TODO: Ignore unknown
    else -> CameraExtensionType.AUTO
  }
}
