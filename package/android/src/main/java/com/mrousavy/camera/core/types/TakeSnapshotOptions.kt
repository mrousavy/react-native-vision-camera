package com.mrousavy.camera.core.types

import android.content.Context
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.core.utils.FileUtils
import com.mrousavy.camera.core.utils.OutputFile

data class TakeSnapshotOptions(val file: OutputFile, val quality: Int) {

  companion object {
    fun fromJSValue(context: Context, map: ReadableMap): TakeSnapshotOptions {
      val quality = if (map.hasKey("quality")) map.getInt("quality") else 100
      val directory = if (map.hasKey("path")) FileUtils.getDirectory(map.getString("path")) else context.cacheDir

      val outputFile = OutputFile(context, directory, ".jpg")
      return TakeSnapshotOptions(outputFile, quality)
    }
  }
}
