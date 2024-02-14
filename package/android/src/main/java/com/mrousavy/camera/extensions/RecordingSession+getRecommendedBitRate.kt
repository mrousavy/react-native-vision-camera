package com.mrousavy.camera.extensions

import android.media.CamcorderProfile
import android.media.MediaRecorder.VideoEncoder
import android.os.Build
import android.util.Log
import com.mrousavy.camera.core.RecordingSession
import com.mrousavy.camera.types.VideoCodec
import com.mrousavy.camera.utils.CamcorderProfileUtils
import kotlin.math.abs

data class RecommendedProfile(
  val bitRate: Int,
  // VideoEncoder.H264 or VideoEncoder.HEVC
  val codec: Int,
  // 8-bit or 10-bit
  val bitDepth: Int,
  // 30 or 60 FPS
  val fps: Int
)

fun RecordingSession.getRecommendedBitRate(fps: Int, codec: VideoCodec, hdr: Boolean): Int {
  val targetResolution = size
  val encoder = codec.toVideoEncoder()
  val bitDepth = if (hdr) 10 else 8
  val quality = CamcorderProfileUtils.findClosestCamcorderProfileQuality(cameraId, targetResolution, true)
  Log.i("CamcorderProfile", "Closest matching CamcorderProfile: $quality")

  var recommendedProfile: RecommendedProfile? = null

  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
    val profiles = CamcorderProfile.getAll(cameraId, quality)
    if (profiles != null) {
      val best = profiles.videoProfiles.filterNotNull().minByOrNull {
        abs(it.width * it.height - targetResolution.width * targetResolution.height)
      }

      if (best != null) {
        recommendedProfile = RecommendedProfile(
          best.bitrate,
          best.codec,
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) best.bitDepth else 8,
          best.frameRate
        )
      }
    }
  }

  if (recommendedProfile == null) {
    val cameraIdInt = cameraId.toIntOrNull()
    val profile = if (cameraIdInt != null) {
      CamcorderProfile.get(cameraIdInt, quality)
    } else {
      CamcorderProfile.get(quality)
    }
    recommendedProfile = RecommendedProfile(
      profile.videoBitRate,
      profile.videoCodec,
      8,
      profile.videoFrameRate
    )
  }

  var bitRate = recommendedProfile.bitRate.toDouble()
  // the target bit-rate is for e.g. 30 FPS, but we use 60 FPS. up-scale it
  bitRate = bitRate / recommendedProfile.fps * fps
  // the target bit-rate might be in 8-bit SDR, but we record in 10-bit HDR. up-scale it
  bitRate = bitRate / recommendedProfile.bitDepth * bitDepth
  if (recommendedProfile.codec == VideoEncoder.H264 && encoder == VideoEncoder.HEVC) {
    // the target bit-rate is for H.264, but we use H.265, which is 20% smaller
    bitRate *= 0.8
  } else if (recommendedProfile.codec == VideoEncoder.HEVC && encoder == VideoEncoder.H264) {
    // the target bit-rate is for H.265, but we use H.264, which is 20% larger
    bitRate *= 1.2
  }
  return bitRate.toInt()
}
