package com.mrousavy.camera.core.types

import android.content.Context
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.core.utils.FileUtils
import java.io.File

data class TakeSnapshotOptions(val quality: Int, val directory: File) {
  val file: File = File.createTempFile("mrousavy", ".jpg", directory)

  companion object {
    fun fromJSValue(context: Context, map: ReadableMap): TakeSnapshotOptions {
      val quality = if (map.hasKey("quality")) map.getInt("quality") else 100
      val directory = if (map.hasKey("path")) FileUtils.getDirectory(map.getString("path")) else context.cacheDir
      return TakeSnapshotOptions(quality, directory)
    }
  }
}
