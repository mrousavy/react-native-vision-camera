package com.mrousavy.camera.core.types

import android.content.Context
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.core.utils.FileUtils
import java.io.File

data class TakePhotoOptions(val flash: Flash, val enableShutterSound: Boolean, val directory: File) {
  val file: File = File.createTempFile("mrousavy", ".jpg", directory)

  companion object {
    fun fromJS(context: Context, map: ReadableMap): TakePhotoOptions {
      val flash = if (map.hasKey("flash")) Flash.fromUnionValue(map.getString("flash")) else Flash.OFF
      val enableShutterSound = if (map.hasKey("enableShutterSound")) map.getBoolean("enableShutterSound") else false
      val directory = if (map.hasKey("path")) FileUtils.getDirectory(map.getString("path")) else context.cacheDir
      return TakePhotoOptions(flash, enableShutterSound, directory)
    }
  }
}
