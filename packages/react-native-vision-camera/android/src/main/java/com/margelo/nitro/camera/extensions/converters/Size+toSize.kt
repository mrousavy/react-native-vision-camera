package com.margelo.nitro.camera.extensions.converters

import android.util.Size

fun Size.toSize(): com.margelo.nitro.camera.Size {
  return com.margelo.nitro.camera
    .Size(width.toDouble(), height.toDouble())
}

fun com.margelo.nitro.camera.Size.toSize(): Size {
  return Size(width.toInt(), height.toInt())
}
