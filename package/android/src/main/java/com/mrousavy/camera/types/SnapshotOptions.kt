package com.mrousavy.camera.types

import com.facebook.react.bridge.ReadableMap

data class SnapshotOptions(val quality: Int) {
  companion object {
    fun fromJSValue(options: ReadableMap): SnapshotOptions {
      val quality = options.getInt("quality")
      return SnapshotOptions(quality)
    }
  }
}
