package com.mrousavy.camera.utils

import android.util.Size

fun Array<Size>.closestToOrMax(size: Size?): Size {
  return if (size != null) {
    this.minBy { (it.width - size.width) + (it.height - size.height) }
  } else {
    this.maxBy { it.width * it.height }
  }
}
