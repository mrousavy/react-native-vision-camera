package com.mrousavy.camera.extensions

import android.media.CamcorderProfile
import android.os.Build
import android.util.Log
import android.util.Size
import com.mrousavy.camera.core.RecordingSession
import kotlin.math.abs

fun RecordingSession.getRecommendedBitRate(): Int {
  val targetResolution = size
  val quality = findClosestCamcorderProfileQuality(targetResolution)
  Log.i("CamcorderProfile", "Closest matching CamcorderProfile: $quality")

  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
    val profiles = CamcorderProfile.getAll(cameraId, quality)
    if (profiles != null) {
      val best = profiles.videoProfiles.minBy { abs(it.width * it.height - targetResolution.width * targetResolution.height) }
      return best.bitrate
    }
  }

  val cameraIdInt = cameraId.toIntOrNull()
  if (cameraIdInt != null) {
    val profile = CamcorderProfile.get(cameraIdInt, quality)
    return profile.videoBitRate
  }

  val profile = CamcorderProfile.get(quality)
  return profile.videoBitRate
}

private fun getResolutionForCamcorderProfileQuality(camcorderProfile: Int): Int {
  return when (camcorderProfile) {
    CamcorderProfile.QUALITY_QCIF -> 176 * 144
    CamcorderProfile.QUALITY_QVGA -> 320 * 240
    CamcorderProfile.QUALITY_CIF -> 352 * 288
    CamcorderProfile.QUALITY_VGA -> 640 * 480
    CamcorderProfile.QUALITY_480P -> 720 * 480
    CamcorderProfile.QUALITY_720P -> 1280 * 720
    CamcorderProfile.QUALITY_1080P -> 1920 * 1080
    CamcorderProfile.QUALITY_2K -> 2048 * 1080
    CamcorderProfile.QUALITY_QHD -> 2560 * 1440
    CamcorderProfile.QUALITY_2160P -> 3840 * 2160
    CamcorderProfile.QUALITY_4KDCI -> 4096 * 2160
    CamcorderProfile.QUALITY_8KUHD -> 7680 * 4320
    else -> throw Error("Invalid CamcorderProfile \"$camcorderProfile\"!")
  }
}

private fun findClosestCamcorderProfileQuality(resolution: Size): Int {
  // Iterate through all available CamcorderProfiles and find the one that matches the closest
  val targetResolution = resolution.width * resolution.height
  val closestProfile = (CamcorderProfile.QUALITY_QCIF..CamcorderProfile.QUALITY_8KUHD).minBy { profile ->
    val currentResolution = getResolutionForCamcorderProfileQuality(profile)
    return@minBy abs(currentResolution - targetResolution)
  }
  return closestProfile
}
