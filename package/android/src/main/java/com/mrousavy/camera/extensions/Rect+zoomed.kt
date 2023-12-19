package com.mrousavy.camera.extensions

import android.graphics.Rect

fun Rect.zoomed(zoomFactor: Float): Rect {
  val dx = (width() / zoomFactor / 2).toInt()
  val dy = (height() / zoomFactor / 2).toInt()
  val left = centerX() - this.left - dx
  val top = centerY() - this.top - dy
  val right = centerX() - this.left + dx
  val bottom = centerY() - this.top + dy
  return Rect(left, top, right, bottom)
}
