package com.mrousavy.camera.core.capture

import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CaptureRequest
import com.mrousavy.camera.core.CameraDeviceDetails
import com.mrousavy.camera.core.outputs.SurfaceOutput

interface CaptureRequestGenerator {
  fun createCaptureRequest(device: CameraDevice): CaptureRequest.Builder

  fun applyToCaptureRequest(builder: CaptureRequest.Builder, outputs: List<SurfaceOutput>, cameraDeviceDetails: CameraDeviceDetails)
}
