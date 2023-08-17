package com.mrousavy.camera.parsers

import android.media.MediaRecorder
import com.mrousavy.camera.InvalidTypeScriptUnionError

enum class VideoFileType(override val unionValue: String): JSUnionValue {
  MOV("mov"),
  MP4("mp4");

  fun toExtension(): String {
    return when (this) {
      MOV -> ".mov"
      MP4 -> ".mp4"
    }
  }

  companion object: JSUnionValue.Companion<VideoFileType> {
    override fun fromUnionValue(unionValue: String?): VideoFileType {
      return when (unionValue) {
        "mov" -> MOV
        "mp4" -> MP4
        else -> throw InvalidTypeScriptUnionError("fileType", unionValue ?: "(null)")
      }
    }
  }
}
