package com.mrousavy.camera.utils

import com.facebook.react.bridge.WritableArray

fun WritableArray.pushInt(value: Int?) {
  if (value == null)
    this.pushNull()
  else
    this.pushInt(value)
}

fun WritableArray.pushDouble(value: Double?) {
  if (value == null)
    this.pushNull()
  else
    this.pushDouble(value)
}

fun WritableArray.pushBoolean(value: Boolean?) {
  if (value == null)
    this.pushNull()
  else
    this.pushBoolean(value)
}
