package com.mrousavy.camera.core.types

import com.mrousavy.camera.core.InvalidTypeScriptUnionError

enum class VideoStabilizationMode(override val unionValue: String) : JSUnionValue {
  OFF("off"),
  STANDARD("standard"),
  CINEMATIC("cinematic"),
  CINEMATIC_EXTENDED("cinematic-extended");

  private val score: Int
    get() {
      return when (this) {
        OFF -> 0
        STANDARD -> 1
        CINEMATIC -> 2
        CINEMATIC_EXTENDED -> 3
      }
    }

  fun isAtLeast(mode: VideoStabilizationMode): Boolean = score >= mode.score

  companion object : JSUnionValue.Companion<VideoStabilizationMode> {
    override fun fromUnionValue(unionValue: String?): VideoStabilizationMode =
      when (unionValue) {
        "off" -> OFF
        "auto" -> OFF
        "standard" -> STANDARD
        "cinematic" -> CINEMATIC
        "cinematic-extended" -> CINEMATIC_EXTENDED
        else -> throw InvalidTypeScriptUnionError("videoStabilizationMode", unionValue)
      }
  }
}
