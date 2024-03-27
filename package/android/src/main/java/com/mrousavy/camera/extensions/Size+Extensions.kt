package com.mrousavy.camera.extensions

import android.util.Size
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

fun List<Size>.closestToOrMax(size: Size?): Size =
  if (size != null) {
    this.minBy { abs((it.width * it.height) - (size.width * size.height)) }
  } else {
    this.maxBy { it.width * it.height }
  }

val Size.bigger: Int
  get() = max(width, height)
val Size.smaller: Int
  get() = min(width, height)

operator fun Size.compareTo(other: Size): Int = (this.width * this.height).compareTo(other.width * other.height)
