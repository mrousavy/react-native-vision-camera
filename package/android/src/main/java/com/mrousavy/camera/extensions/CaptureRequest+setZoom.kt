package com.mrousavy.camera.extensions

import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CaptureRequest
import android.os.Build
import android.util.Range

fun CaptureRequest.Builder.setZoom(zoom: Float, cameraCharacteristics: CameraCharacteristics) {
    val zoomRange = (
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        cameraCharacteristics.get(CameraCharacteristics.CONTROL_ZOOM_RATIO_RANGE)
      } else {
        null
      }
      ) ?: Range(1f, cameraCharacteristics.get(CameraCharacteristics.SCALER_AVAILABLE_MAX_DIGITAL_ZOOM) ?: 1f)
    val zoomClamped = zoomRange.clamp(zoom)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      this.set(CaptureRequest.CONTROL_ZOOM_RATIO, zoomClamped)
    } else {
      val size = cameraCharacteristics.get(CameraCharacteristics.SENSOR_INFO_ACTIVE_ARRAY_SIZE)!!
      this.set(CaptureRequest.SCALER_CROP_REGION, size.zoomed(zoomClamped))
    }
}
