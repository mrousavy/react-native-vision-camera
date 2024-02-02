package com.mrousavy.camera.core.capture

import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CaptureRequest
import com.mrousavy.camera.core.CameraDeviceDetails
import com.mrousavy.camera.core.outputs.SurfaceOutput

class PhotoRequest(repeatingRequest: RepeatingRequest): RepeatingRequest(repeatingRequest) {
  override fun createCaptureRequestBuilder(device: CameraDevice): CaptureRequest.Builder {
    return device.createCaptureRequest(CameraDevice.TEMPLATE_STILL_CAPTURE)
  }

  override fun toCaptureRequest(device: CameraDevice, deviceDetails: CameraDeviceDetails, outputs: List<SurfaceOutput>): CaptureRequest {
    return super.toCaptureRequest(device, deviceDetails, outputs)
  }
}
