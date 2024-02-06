package com.mrousavy.camera.core.capture

import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CaptureRequest
import com.mrousavy.camera.core.CameraDeviceDetails
import com.mrousavy.camera.core.outputs.SurfaceOutput
import com.mrousavy.camera.types.Flash
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.QualityPrioritization
import com.mrousavy.camera.types.Torch
import com.mrousavy.camera.types.VideoStabilizationMode

class PhotoRequest(repeatingRequest: RepeatingRequest,
                   private val qualityPrioritization: QualityPrioritization,
                   private val flash: Flash,
                   private val enableRedEyeReduction: Boolean,
                   private val enableAutoStabilization: Boolean,
                   enablePhotoHdr: Boolean,
                   private val outputOrientation: Orientation
): CameraCaptureRequest(Torch.OFF,
                        enablePhotoHdr,
                        repeatingRequest.enableLowLightBoost,
                        repeatingRequest.exposureBias,
                        repeatingRequest.zoom,
                        repeatingRequest.format) {
  override fun createCaptureRequest(
    device: CameraDevice,
    deviceDetails: CameraDeviceDetails,
    outputs: List<SurfaceOutput>
  ): CaptureRequest.Builder {
    val template = if (deviceDetails.supportsZsl) Template.PHOTO_ZSL else Template.PHOTO
    return super.createCaptureRequest(template, device, deviceDetails, outputs)
  }

  override fun createCaptureRequest(
    template: Template,
    device: CameraDevice,
    deviceDetails: CameraDeviceDetails,
    outputs: List<SurfaceOutput>
  ): CaptureRequest.Builder {
    val builder = super.createCaptureRequest(template, device, deviceDetails, outputs)

    // Set JPEG quality
    val jpegQuality = when (qualityPrioritization) {
      QualityPrioritization.SPEED -> 85
      QualityPrioritization.BALANCED -> 92
      QualityPrioritization.QUALITY -> 100
    }
    builder.set(CaptureRequest.JPEG_QUALITY, jpegQuality.toByte())

    // Set JPEG Orientation
    val targetOrientation = outputOrientation.toSensorRelativeOrientation(deviceDetails)
    builder.set(CaptureRequest.JPEG_ORIENTATION, targetOrientation.toDegrees())

    // TODO: Fix flash.
    when (flash) {
      // Set the Flash Mode
      Flash.OFF -> {
        builder.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_ON)
        builder.set(CaptureRequest.FLASH_MODE, CaptureRequest.FLASH_MODE_OFF)
      }
      Flash.ON -> {
        builder.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_ON)
        builder.set(CaptureRequest.FLASH_MODE, CaptureRequest.FLASH_MODE_TORCH)
      }
      Flash.AUTO -> {
        if (enableRedEyeReduction) {
          builder.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_ON_AUTO_FLASH_REDEYE)
        } else {
          builder.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_ON_AUTO_FLASH)
        }
      }
    }

    // Set stabilization for this Frame
    if (enableAutoStabilization) {
      if (deviceDetails.opticalStabilizationModes.contains(CameraCharacteristics.LENS_OPTICAL_STABILIZATION_MODE_ON)) {
        builder.set(CaptureRequest.LENS_OPTICAL_STABILIZATION_MODE, CameraCharacteristics.LENS_OPTICAL_STABILIZATION_MODE_ON)
      } else if (deviceDetails.digitalStabilizationModes.contains(CameraCharacteristics.CONTROL_VIDEO_STABILIZATION_MODE_ON)) {
        builder.set(CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE, CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE_ON)
      }
    }

    return builder
  }
}
