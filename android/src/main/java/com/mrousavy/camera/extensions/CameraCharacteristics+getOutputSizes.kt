package com.mrousavy.camera.extensions

import android.content.res.Resources
import android.hardware.camera2.CameraCharacteristics
import android.media.CamcorderProfile
import android.os.Build
import android.util.Log
import android.util.Size
import android.view.SurfaceHolder
import android.view.SurfaceView

private fun getMaximumPreviewSize(): Size {
  // See https://developer.android.com/reference/android/hardware/camera2/params/StreamConfigurationMap
  // According to the Android Developer documentation, PREVIEW streams can have a resolution
  // of up to the phone's display's resolution, with a maximum of 1920x1080.
  val display1080p = Size(1920, 1080)
  val displaySize = Size(Resources.getSystem().displayMetrics.widthPixels, Resources.getSystem().displayMetrics.heightPixels)
  val isHighResScreen = displaySize.bigger >= display1080p.bigger || displaySize.smaller >= display1080p.smaller
  Log.i("PreviewSize", "Phone has a ${displaySize.width} x ${displaySize.height} screen.")
  return if (isHighResScreen) display1080p else displaySize
}

/**
 * Gets the maximum Preview Resolution this device is capable of streaming at. (For [SurfaceView])
 */
fun CameraCharacteristics.getPreviewSize(): Size {
  val config = this.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
  val previewSize = getMaximumPreviewSize()
  val outputSizes = config.getOutputSizes(SurfaceHolder::class.java).sortedByDescending { it.width * it.height }
  return outputSizes.first { it.bigger <= previewSize.bigger && it.smaller <= previewSize.smaller }
}

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
