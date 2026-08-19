package com.margelo.nitro.camera.extensions.converters

import com.margelo.nitro.camera.MirrorMode

fun MirrorMode.toMirrorMode(): Int {
  return when (this) {
    MirrorMode.ON -> androidx.camera.core.MirrorMode.MIRROR_MODE_ON
    MirrorMode.OFF -> androidx.camera.core.MirrorMode.MIRROR_MODE_OFF
    MirrorMode.AUTO -> androidx.camera.core.MirrorMode.MIRROR_MODE_ON_FRONT_ONLY
  }
}
