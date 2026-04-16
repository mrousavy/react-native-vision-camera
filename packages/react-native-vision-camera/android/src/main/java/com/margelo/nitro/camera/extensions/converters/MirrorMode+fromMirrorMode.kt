package com.margelo.nitro.camera.extensions.converters

import android.annotation.SuppressLint
import com.margelo.nitro.camera.MirrorMode

@SuppressLint("RestrictedApi")
fun MirrorMode.Companion.fromMirrorMode(
  @androidx.camera.core.MirrorMode.Mirror mirrorMode: Int,
): MirrorMode {
  return when (mirrorMode) {
    androidx.camera.core.MirrorMode.MIRROR_MODE_ON -> MirrorMode.ON
    androidx.camera.core.MirrorMode.MIRROR_MODE_OFF -> MirrorMode.OFF
    androidx.camera.core.MirrorMode.MIRROR_MODE_UNSPECIFIED -> MirrorMode.AUTO
    androidx.camera.core.MirrorMode.MIRROR_MODE_ON_FRONT_ONLY -> MirrorMode.AUTO
    else -> MirrorMode.AUTO
  }
}
