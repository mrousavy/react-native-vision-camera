package com.mrousavy.camera.parsers

import android.util.Size
import android.util.SizeF
import kotlin.math.max
import kotlin.math.min

val Size.bigger: Int
  get() = max(this.width, this.height)
val Size.smaller: Int
  get() = min(this.width, this.height)

val SizeF.bigger: Float
  get() = max(this.width, this.height)
val SizeF.smaller: Float
  get() = min(this.width, this.height)

fun areUltimatelyEqual(size1: Size, size2: Size): Boolean {
  return size1.width * size1.height == size2.width * size2.height
}
