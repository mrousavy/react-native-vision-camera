package com.margelo.nitro.camera.extensions

import android.hardware.camera2.CameraCharacteristics
import androidx.annotation.OptIn
import androidx.camera.camera2.adapter.PhysicalCameraInfoAdapter
import androidx.camera.camera2.interop.Camera2CameraInfo
import androidx.camera.camera2.interop.ExperimentalCamera2Interop
import androidx.camera.core.CameraInfo
import com.margelo.nitro.camera.DeviceType
import com.margelo.nitro.camera.utils.ImageFormatUtils

val CameraInfo.deviceType: DeviceType
  @OptIn(ExperimentalCamera2Interop::class)
  get() {
    if (this is PhysicalCameraInfoAdapter) {
      // TODO: PhysicalCameraInfoAdapter throws when accessing `intrinsicZoomRatio`,
      //       so we need another way to figure out what kind of Camera this is...
      return DeviceType.UNKNOWN
    }

    if (this.physicalCameraInfos.size > 1) {
      // multi-camera
      return when (this.physicalCameraInfos.size) {
        2 -> DeviceType.DUAL
        3 -> DeviceType.TRIPLE
        4 -> DeviceType.QUAD
        else -> DeviceType.UNKNOWN
      }
    } else {
      // single camera
      val camera2Info = Camera2CameraInfo.fromSafe(this)
      if (camera2Info?.supportsDepthOnly == true) {
        // If it supports only DEPTH, it's a ToF Depth Camera
        return DeviceType.TIME_OF_FLIGHT_DEPTH
      }
      return when {
        intrinsicZoomRatio < 1f -> DeviceType.ULTRA_WIDE_ANGLE
        intrinsicZoomRatio > 1f -> DeviceType.TELEPHOTO
        else -> DeviceType.WIDE_ANGLE
      }
    }
  }

private val Camera2CameraInfo.supportsDepthOnly: Boolean
  @OptIn(ExperimentalCamera2Interop::class)
  get() {
    val map =
      this.getCameraCharacteristic(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)
        ?: return false
    val supportedFormats = map.outputFormats
    val isAllDepthFormats = supportedFormats.all { ImageFormatUtils.isDepthFormat(it) }
    return isAllDepthFormats
  }
