package com.mrousavy.camera.extensions

import android.util.Size
import android.util.SizeF
import com.mrousavy.camera.types.Orientation
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

fun List<Size>.closestToOrMax(size: Size?): Size =
  if (size != null) {
    this.minBy { abs((it.width * it.height) - (size.width * size.height)) }
  } else {
    this.maxBy { it.width * it.height }
  }

fun Size.rotatedBy(orientation: Orientation): Size =
  when (orientation) {
    Orientation.PORTRAIT, Orientation.PORTRAIT_UPSIDE_DOWN -> this
    Orientation.LANDSCAPE_LEFT, Orientation.LANDSCAPE_RIGHT -> Size(height, width)
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
