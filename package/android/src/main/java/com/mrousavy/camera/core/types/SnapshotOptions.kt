package com.mrousavy.camera.core.types

import com.facebook.react.bridge.ReadableMap

data class SnapshotOptions(val quality: Int) {
  companion object {
    fun fromJSValue(options: ReadableMap): SnapshotOptions {
      val quality = options.getInt("quality")
      return SnapshotOptions(quality)
    }
  }
}
