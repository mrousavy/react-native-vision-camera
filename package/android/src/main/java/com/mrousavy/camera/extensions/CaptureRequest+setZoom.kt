package com.mrousavy.camera.extensions

import android.hardware.camera2.CaptureRequest
import android.os.Build
import com.mrousavy.camera.core.CameraDeviceDetails
import com.mrousavy.camera.types.HardwareLevel

fun CaptureRequest.Builder.setZoom(zoom: Float, deviceDetails: CameraDeviceDetails) {
  val zoomRange = deviceDetails.zoomRange
  val zoomClamped = zoomRange.clamp(zoom)

  if (deviceDetails.hardwareLevel.isAtLeast(HardwareLevel.LIMITED) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
    this.set(CaptureRequest.CONTROL_ZOOM_RATIO, zoomClamped)
  } else {
    val size = deviceDetails.activeSize
    this.set(CaptureRequest.SCALER_CROP_REGION, size.zoomed(zoomClamped))
  }
}
