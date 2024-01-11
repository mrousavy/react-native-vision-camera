package com.mrousavy.camera.extensions

import android.util.Size
import android.util.SizeF
import android.view.Surface
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

fun List<Size>.closestToOrMax(size: Size?): Size =
  if (size != null) {
    this.minBy { abs((it.width * it.height) - (size.width * size.height)) }
  } else {
    this.maxBy { it.width * it.height }
  }

fun Size.rotated(surfaceRotation: Int): Size =
  when (surfaceRotation) {
    Surface.ROTATION_0 -> Size(width, height)
    Surface.ROTATION_90 -> Size(height, width)
    Surface.ROTATION_180 -> Size(width, height)
    Surface.ROTATION_270 -> Size(height, width)
    else -> Size(width, height)
  }

val Size.bigger: Int
  get() = max(width, height)
val Size.smaller: Int
  get() = min(width, height)

val SizeF.bigger: Float
  get() = max(this.width, this.height)
val SizeF.smaller: Float
  get() = min(this.width, this.height)

operator fun Size.compareTo(other: Size): Int = (this.width * this.height).compareTo(other.width * other.height)
