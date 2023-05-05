package com.mrousavy.camera.utils

import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap

class CameraDevice(private val cameraId: String, private val cameraManager: CameraManager) {
  private val characteristics = cameraManager.getCameraCharacteristics(cameraId)
  private val position: String
    get () {
      return when (characteristics.get(CameraCharacteristics.LENS_FACING)) {
        CameraCharacteristics.LENS_FACING_BACK -> "back"
        CameraCharacteristics.LENS_FACING_FRONT -> "front"
        CameraCharacteristics.LENS_FACING_EXTERNAL -> "external"
        else -> "unspecified"
      }
    }

  fun toMap(): ReadableMap {
    val map = Arguments.createMap()
    map.putString("id", cameraId)
    map.putString("position", position)
    map.putBoolean("photoHeight", false)
    map.putBoolean("photoWidth", false)
    map.putBoolean("videoHeight", false)
    map.putBoolean("videoWidth", false)
    map.putBoolean("isHighestPhotoQualitySupported", false)
    map.putBoolean("maxISO", false)
    map.putBoolean("minISO", false)
    map.putBoolean("fieldOfView", false)
    map.putBoolean("maxZoom", false)
    map.putBoolean("colorSpaces", false)
    map.putBoolean("supportsVideoHDR", false)
    map.putBoolean("supportsPhotoHDR", false)
    map.putBoolean("frameRateRanges", false)
    map.putBoolean("autoFocusSystem", false)
    map.putBoolean("videoStabilizationModes", false)
    map.putBoolean("pixelFormat", false)
    return map
  }
}
