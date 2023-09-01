package com.mrousavy.camera.extensions

import android.graphics.Rect

fun Rect.zoomed(zoomFactor: Float): Rect {
  val height = bottom - top
  val width = right - left

  val left = this.left + (width / zoomFactor / 2)
  val top = this.top + (height / zoomFactor / 2)
  val right = this.right - (width / zoomFactor / 2)
  val bottom = this.bottom - (height / zoomFactor / 2)
  return Rect(left.toInt(), top.toInt(), right.toInt(), bottom.toInt())
}
