package com.mrousavy.camera.core.types

import android.content.Context
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.core.utils.FileUtils
import com.mrousavy.camera.core.utils.OutputFile

data class TakePhotoOptions(
  val file: OutputFile,
  val flash: Flash,
  val enableShutterSound: Boolean,
  val thumbnailSize: Size? 
) {
  data class Size(val width: Int, val height: Int)

  companion object {
    fun fromJS(context: Context, map: ReadableMap): TakePhotoOptions {
      val flash = if (map.hasKey("flash")) Flash.fromUnionValue(map.getString("flash")) else Flash.OFF
      val enableShutterSound = if (map.hasKey("enableShutterSound")) map.getBoolean("enableShutterSound") else false
      val directory = if (map.hasKey("path")) FileUtils.getDirectory(map.getString("path")) else context.cacheDir

      // Parse thumbnailSize
      val thumbnailSize = if (map.hasKey("thumbnailSize")) {
        val sizeMap = map.getMap("thumbnailSize")
        if (sizeMap != null && sizeMap.hasKey("width") && sizeMap.hasKey("height")) {
          Size(sizeMap.getInt("width"), sizeMap.getInt("height"))
        } else null
      } else null

      val outputFile = OutputFile(context, directory, ".jpg")
      return TakePhotoOptions(outputFile, flash, enableShutterSound, thumbnailSize)
    }
  }
}
