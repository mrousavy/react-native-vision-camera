package com.mrousavy.camera.core.types

import android.media.MediaRecorder

enum class VideoCodec(override val unionValue: String) : JSUnionValue {
  H264("h264"),
  H265("h265");

  fun toVideoEncoder(): Int =
    when (this) {
      H264 -> MediaRecorder.VideoEncoder.H264
      H265 -> MediaRecorder.VideoEncoder.HEVC
    }

  companion object : JSUnionValue.Companion<VideoCodec> {
    override fun fromUnionValue(unionValue: String?): VideoCodec =
      when (unionValue) {
        "h264" -> H264
        "h265" -> H265
        else -> H264
      }
  }
}
