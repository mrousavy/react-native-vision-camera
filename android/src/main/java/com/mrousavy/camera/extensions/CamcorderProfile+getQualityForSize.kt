package com.mrousavy.camera.extensions

import android.media.CamcorderProfile
import android.util.Size

private val qualitiesMap = mapOf(
  Size(176 - 1, 144 - 1) to CamcorderProfile.QUALITY_LOW,
  Size(176, 144) to CamcorderProfile.QUALITY_QCIF,
  Size(320, 240) to CamcorderProfile.QUALITY_QVGA,
  Size(352, 288) to CamcorderProfile.QUALITY_CIF,
  Size(640, 480) to CamcorderProfile.QUALITY_VGA,
  Size(720, 480) to CamcorderProfile.QUALITY_480P,
  Size(1280, 720) to CamcorderProfile.QUALITY_720P,
  Size(1920, 1080) to CamcorderProfile.QUALITY_1080P,
  Size(2048, 1080) to CamcorderProfile.QUALITY_2K,
  Size(2560, 1440) to CamcorderProfile.QUALITY_QHD,
  Size(3840, 2160) to CamcorderProfile.QUALITY_2160P,
  Size(4096, 2160) to CamcorderProfile.QUALITY_4KDCI,
  Size(7680, 4320) to CamcorderProfile.QUALITY_8KUHD,
  Size(7680 + 1, 4320 + 1) to CamcorderProfile.QUALITY_HIGH,
)

fun getCamcorderQualityForSize(size: Size): Int {
  // Find closest match
  val closestMatch = qualitiesMap.keys.closestTo(size)
  return qualitiesMap[closestMatch] ?: CamcorderProfile.QUALITY_HIGH
}
