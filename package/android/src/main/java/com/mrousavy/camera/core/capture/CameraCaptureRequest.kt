package com.mrousavy.camera.core.capture

import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CaptureRequest
import com.mrousavy.camera.core.outputs.SurfaceOutput

class CameraCaptureRequest(val device: CameraDevice, private val builder: CaptureRequest.Builder) {
  private var targets = arrayListOf<SurfaceOutput>()

  fun addOutput(output: SurfaceOutput) {
    targets.add(output)
    builder.addTarget(output.surface)
  }

  fun removeOutput(output: SurfaceOutput) {
    targets.remove(output)
    builder.removeTarget(output.surface)
  }

  fun removeAllOutputs() {
    targets.forEach { builder.removeTarget(it.surface) }
    targets.clear()
  }

  fun build(): CaptureRequest {
    return builder.build()
  }


  interface Preset {
    fun createCaptureRequest(device: CameraDevice): CameraCaptureRequest
    fun applyToCaptureRequest(request: CameraCaptureRequest)
  }
}
