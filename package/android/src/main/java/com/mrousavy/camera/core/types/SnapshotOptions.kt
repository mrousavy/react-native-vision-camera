package com.mrousavy.camera.core.types

import com.facebook.react.bridge.ReadableMap

data class SnapshotOptions(val quality: Int, val path: String?) {
  companion object {
    fun fromJSValue(options: ReadableMap): SnapshotOptions {
      val quality = if (options.hasKey("quality")) options.getInt("quality") else 100
      val path = options.getString("path")
      return SnapshotOptions(quality, path)
    }
  }
}
