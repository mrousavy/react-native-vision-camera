package com.mrousavy.camera.core.types

import com.mrousavy.camera.core.InvalidTypeScriptUnionError

enum class VideoFileType(override val unionValue: String) : JSUnionValue {
  MOV("mov"),
  MP4("mp4");

  fun toExtension(): String =
    when (this) {
      MOV -> ".mov"
      MP4 -> ".mp4"
    }

  companion object : JSUnionValue.Companion<VideoFileType> {
    override fun fromUnionValue(unionValue: String?): VideoFileType =
      when (unionValue) {
        "mov" -> MOV
        "mp4" -> MP4
        else -> throw InvalidTypeScriptUnionError("fileType", unionValue ?: "(null)")
      }
  }
}
