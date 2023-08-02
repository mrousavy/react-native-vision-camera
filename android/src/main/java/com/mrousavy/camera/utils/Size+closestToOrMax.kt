package com.mrousavy.camera.utils

import android.util.Size
import kotlin.math.abs

fun Array<Size>.closestToOrMax(size: Size?): Size {
  return if (size != null) {
    this.minBy { abs(it.width - size.width) + abs(it.height - size.height) }
  } else {
    this.maxBy { it.width * it.height }
  }
}
