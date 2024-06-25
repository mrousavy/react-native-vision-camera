package com.mrousavy.camera.core.extensions

import android.util.Size

val Size.aspectRatio: Float
  get() = width.toFloat() / height.toFloat()
