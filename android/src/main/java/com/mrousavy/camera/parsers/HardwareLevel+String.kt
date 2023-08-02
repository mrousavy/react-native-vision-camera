package com.mrousavy.camera.parsers

import android.hardware.camera2.CameraCharacteristics

fun parseHardwareLevel(hardwareLevel: Int): String {
  return when (hardwareLevel) {
    CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY -> "legacy"
    CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LIMITED -> "limited"
    CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_EXTERNAL -> "limited"
    CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_FULL -> "full"
    CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_3 -> "full"
    else -> "legacy"
  }
}
