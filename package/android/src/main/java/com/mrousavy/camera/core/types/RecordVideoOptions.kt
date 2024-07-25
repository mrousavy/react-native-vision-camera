package com.mrousavy.camera.core.types

import android.content.Context
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.core.utils.FileUtils
import java.io.File

class RecordVideoOptions(
  val directory: File,
  fileType: VideoFileType,
  val videoCodec: VideoCodec,
  val videoBitRateOverride: Double?,
  val videoBitRateMultiplier: Double?
) {
  val file: File = File.createTempFile("mrousavy", fileType.toExtension(), directory)

  companion object {
    fun fromJSValue(context: Context, map: ReadableMap): RecordVideoOptions {
      val directory = if (map.hasKey("path")) FileUtils.getDirectory(map.getString("path")) else context.cacheDir
      val fileType = if (map.hasKey("fileType")) VideoFileType.fromUnionValue(map.getString("fileType")) else VideoFileType.MOV
      val videoCodec = if (map.hasKey("videoCodec")) VideoCodec.fromUnionValue(map.getString("videoCodec")) else VideoCodec.H264
      val videoBitRateOverride = if (map.hasKey("videoBitRateOverride")) map.getDouble("videoBitRateOverride") else null
      val videoBitRateMultiplier = if (map.hasKey("videoBitRateMultiplier")) map.getDouble("videoBitRateMultiplier") else null
      return RecordVideoOptions(directory, fileType, videoCodec, videoBitRateOverride, videoBitRateMultiplier)
    }
  }
}
