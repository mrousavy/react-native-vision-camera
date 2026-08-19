package com.margelo.nitro.camera.extensions.converters

import com.margelo.nitro.camera.MirrorMode

fun MirrorMode.Companion.fromMirrorMode(mirrorMode: Int): MirrorMode {
  return when (mirrorMode) {
    androidx.camera.core.MirrorMode.MIRROR_MODE_ON -> MirrorMode.ON
    androidx.camera.core.MirrorMode.MIRROR_MODE_OFF -> MirrorMode.OFF
    androidx.camera.core.MirrorMode.MIRROR_MODE_ON_FRONT_ONLY -> MirrorMode.AUTO
    else -> MirrorMode.AUTO
  }
}
