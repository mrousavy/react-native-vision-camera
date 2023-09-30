package com.mrousavy.camera.extensions

import android.hardware.camera2.CameraCharacteristics
import android.media.CamcorderProfile
import android.os.Build
import android.util.Size

private fun getMaximumVideoSize(cameraId: String): Size? {
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
}

fun CameraCharacteristics.getVideoSizes(cameraId: String, format: Int): List<Size> {
  val config = this.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
  val sizes = config.getOutputSizes(format) ?: emptyArray()
  val maxVideoSize = getMaximumVideoSize(cameraId)
  if (maxVideoSize != null) {
    return sizes.filter { it.bigger <= maxVideoSize.bigger }
  }
  return sizes.toList()
}

fun CameraCharacteristics.getPhotoSizes(format: Int): List<Size> {
  val config = this.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
  val sizes = config.getOutputSizes(format) ?: emptyArray()
  val highResSizes = config.getHighResolutionOutputSizes(format) ?: emptyArray()
  return sizes.plus(highResSizes).toList()
}
