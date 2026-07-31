package com.margelo.nitro.camera.extensions

import android.util.Size

internal fun Array<Size>?.toListOrEmpty(): List<Size> {
  return this?.toList() ?: emptyList()
}
