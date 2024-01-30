package com.mrousavy.camera

import android.annotation.SuppressLint
import android.content.Context
import android.view.Gravity
import android.widget.FrameLayout
import android.widget.TextView
import kotlin.math.roundToInt

@SuppressLint("SetTextI18n")
class FpsCounterView(context: Context): FrameLayout(context) {
  private val textView = TextView(context)
  private var lastTick = System.currentTimeMillis()

  init {
    textView.textSize = 16f
    textView.text = "0 FPS"

    val layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)
    layoutParams.setMargins(15, 15, 0, 0)
    layoutParams.gravity = Gravity.TOP or Gravity.LEFT
    addView(textView, layoutParams)
  }

  fun onTick() {
    val currentTick = System.currentTimeMillis()
    val diffToLast = currentTick - lastTick
    val fps = (1_000.0 / diffToLast.toDouble()).roundToInt()
    textView.text = "$fps FPS"
  }
}
