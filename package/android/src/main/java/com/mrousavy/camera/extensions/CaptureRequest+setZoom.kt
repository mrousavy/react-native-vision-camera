package com.mrousavy.camera.extensions

import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CaptureRequest
import android.os.Build
import android.util.Range

fun CaptureRequest.Builder.setZoom(zoom: Float, cameraCharacteristics: CameraCharacteristics) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val zoomRange = cameraCharacteristics.get(CameraCharacteristics.CONTROL_ZOOM_RATIO_RANGE) ?: Range(1f, 1f)
      val zoomClamped = zoomRange.clamp(zoom)
      this.set(CaptureRequest.CONTROL_ZOOM_RATIO, zoomClamped)
    } else {
      val maxZoom = cameraCharacteristics.get(CameraCharacteristics.SCALER_AVAILABLE_MAX_DIGITAL_ZOOM)
      val zoomRange = Range(1f, maxZoom ?: 1f)
      val size = cameraCharacteristics.get(CameraCharacteristics.SENSOR_INFO_ACTIVE_ARRAY_SIZE)!!
      val zoomClamped = zoomRange.clamp(zoom)
      this.set(CaptureRequest.SCALER_CROP_REGION, size.zoomed(zoomClamped))
    }
}
