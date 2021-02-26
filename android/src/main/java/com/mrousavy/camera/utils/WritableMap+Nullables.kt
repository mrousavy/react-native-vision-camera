package com.mrousavy.camera.utils

import com.facebook.react.bridge.WritableMap

fun WritableMap.putInt(key: String, value: Int?) {
  if (value == null)
    this.putNull(key)
  else
    this.putInt(key, value)
}

fun WritableMap.putDouble(key: String, value: Double?) {
  if (value == null)
    this.putNull(key)
  else
    this.putDouble(key, value)
}

fun WritableMap.putBoolean(key: String, value: Boolean?) {
  if (value == null)
    this.putNull(key)
  else
    this.putBoolean(key, value)
}
