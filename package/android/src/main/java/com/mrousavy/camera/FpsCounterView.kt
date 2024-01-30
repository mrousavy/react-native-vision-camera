package com.mrousavy.camera

import android.content.Context
import android.widget.RelativeLayout
import android.widget.TextView

class FpsCounterView(context: Context): RelativeLayout(context) {
  private val textView = TextView(context)

  init {
    textView.text = "Hello world!"
    addView(textView)
  }
}
