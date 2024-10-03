package com.mrousavy.camera.core.types

import android.content.Context
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.core.utils.FileUtils
import com.mrousavy.camera.core.utils.OutputFile

data class TakePhotoOptions(val file: OutputFile, val flash: Flash, val enableShutterSound: Boolean, val normalizeOrientation: Boolean) {
  companion object {
    fun fromJS(context: Context, map: ReadableMap): TakePhotoOptions {
      val flash = if (map.hasKey("flash")) Flash.fromUnionValue(map.getString("flash")) else Flash.OFF
      val enableShutterSound = if (map.hasKey("enableShutterSound")) map.getBoolean("enableShutterSound") else false
      val directory = if (map.hasKey("path")) FileUtils.getDirectory(map.getString("path")) else context.cacheDir
      val normalize =  if (map.hasKey("normalizeOrientation")) map.getBoolean("normalizeOrientation") else false
      val outputFile = OutputFile(context, directory, ".jpg")
      return TakePhotoOptions(outputFile, flash, enableShutterSound, normalize)
    }
  }
}
