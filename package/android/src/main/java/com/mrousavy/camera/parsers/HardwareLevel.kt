package com.mrousavy.camera.parsers

import android.hardware.camera2.CameraCharacteristics

enum class HardwareLevel(override val unionValue: String): JSUnionValue {
  LEGACY("legacy"),
  LIMITED("limited"),
  EXTERNAL("external"),
  FULL("full"),
  LEVEL_3("level-3");

  companion object {
    fun fromCameraCharacteristics(cameraCharacteristics: CameraCharacteristics): HardwareLevel {
      return when (cameraCharacteristics.get(CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL)) {
        CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY -> LEGACY
        CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LIMITED -> LIMITED
        CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_EXTERNAL -> EXTERNAL
        CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_FULL -> FULL
        CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_3 -> LEVEL_3
        else -> LEGACY
      }
    }
  }
}
