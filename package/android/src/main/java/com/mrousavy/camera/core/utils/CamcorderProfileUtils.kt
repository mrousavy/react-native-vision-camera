package com.mrousavy.camera.core.utils

import android.annotation.SuppressLint
import android.media.CamcorderProfile
import android.os.Build
import android.util.Log
import android.util.Size
import kotlin.math.abs

class CamcorderProfileUtils {
  companion object {
    private const val TAG = "CamcorderProfileUtils"

    private fun getResolutionForCamcorderProfileQuality(camcorderProfile: Int): Int =
      when (camcorderProfile) {
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

    private fun findClosestCamcorderProfileQuality(cameraId: String, resolution: Size, allowLargerSize: Boolean): Int {
      // Iterate through all available CamcorderProfiles and find the one that matches the closest
      val targetResolution = resolution.width * resolution.height
      val cameraIdInt = cameraId.toIntOrNull()

      @SuppressLint("InlinedApi")
      var profiles = (CamcorderProfile.QUALITY_QCIF..CamcorderProfile.QUALITY_8KUHD).filter { profile ->
        if (cameraIdInt != null) {
          return@filter CamcorderProfile.hasProfile(cameraIdInt, profile)
        } else {
          return@filter CamcorderProfile.hasProfile(profile)
        }
      }
      if (!allowLargerSize) {
        profiles = profiles.filter { profile ->
          val currentResolution = getResolutionForCamcorderProfileQuality(profile)
          return@filter currentResolution <= targetResolution
        }
      }
      val closestProfile = profiles.minBy { profile ->
        val currentResolution = getResolutionForCamcorderProfileQuality(profile)
        return@minBy abs(currentResolution - targetResolution)
      }
      return closestProfile
    }

    fun getMaximumVideoSize(cameraId: String): Size? {
      try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          val profiles = CamcorderProfile.getAll(cameraId, CamcorderProfile.QUALITY_HIGH)
          if (profiles != null) {
            val largestProfile = profiles.videoProfiles.filterNotNull().maxByOrNull { it.width * it.height }
            if (largestProfile != null) {
              return Size(largestProfile.width, largestProfile.height)
            }
          }
        }

        val cameraIdInt = cameraId.toIntOrNull()
        if (cameraIdInt != null) {
          val profile = CamcorderProfile.get(cameraIdInt, CamcorderProfile.QUALITY_HIGH)
          return Size(profile.videoFrameWidth, profile.videoFrameHeight)
        }

        return null
      } catch (e: Throwable) {
        // some Samsung phones just crash when trying to get the CamcorderProfile. Only god knows why.
        Log.e(TAG, "Failed to get maximum video size for Camera ID $cameraId! ${e.message}", e)
        return null
      }
    }

    fun getMaximumFps(cameraId: String, size: Size): Int? {
      try {
        val quality = findClosestCamcorderProfileQuality(cameraId, size, false)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          val profiles = CamcorderProfile.getAll(cameraId, quality)
          if (profiles != null) {
            return profiles.videoProfiles.maxOf { profile -> profile.frameRate }
          }
        }

        val cameraIdInt = cameraId.toIntOrNull()
        if (cameraIdInt != null) {
          val profile = CamcorderProfile.get(cameraIdInt, quality)
          return profile.videoFrameRate
        }

        return null
      } catch (e: Throwable) {
        // some Samsung phones just crash when trying to get the CamcorderProfile. Only god knows why.
        Log.e(TAG, "Failed to get maximum FPS for Camera ID $cameraId! ${e.message}", e)
        return null
      }
    }

    fun getRecommendedBitRate(cameraId: String, videoSize: Size): Int? {
      try {
        val quality = findClosestCamcorderProfileQuality(cameraId, videoSize, true)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          val profiles = CamcorderProfile.getAll(cameraId, quality)
          if (profiles != null) {
            return profiles.videoProfiles.maxOf { profile -> profile.bitrate }
          }
        }

        val cameraIdInt = cameraId.toIntOrNull()
        if (cameraIdInt != null) {
          val profile = CamcorderProfile.get(cameraIdInt, quality)
          return profile.videoBitRate
        }

        return null
      } catch (e: Throwable) {
        // some Samsung phones just crash when trying to get the CamcorderProfile. Only god knows why.
        Log.e(TAG, "Failed to get recommended video bit-rate for Camera ID $cameraId! ${e.message}", e)
        return null
      }
    }
  }
}
