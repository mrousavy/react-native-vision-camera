package com.mrousavy.camera.extensions

import android.graphics.Rect

fun Rect.zoomed(zoomFactor: Float): Rect {
  val dx = (width() / zoomFactor / 2).toInt()
  val dy = (height() / zoomFactor / 2).toInt()
  val left = centerX() - dx
  val top = centerY() - dy
  val right = centerX() + dx
  val bottom = centerY() + dy
  return Rect(left, top, right, bottom)
}
