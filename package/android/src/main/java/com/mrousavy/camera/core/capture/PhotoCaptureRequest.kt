package com.mrousavy.camera.core.capture

import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CaptureRequest
import android.os.Build
import android.util.Log
import com.mrousavy.camera.core.CameraDeviceDetails
import com.mrousavy.camera.core.outputs.SurfaceOutput
import com.mrousavy.camera.types.HardwareLevel
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.QualityPrioritization
import com.mrousavy.camera.types.Torch

class PhotoCaptureRequest(
  repeatingRequest: RepeatingCaptureRequest,
  private val qualityPrioritization: QualityPrioritization,
  private val enableAutoStabilization: Boolean,
  enablePhotoHdr: Boolean,
  private val outputOrientation: Orientation
) : CameraCaptureRequest(
  Torch.OFF,
  enablePhotoHdr,
  repeatingRequest.enableLowLightBoost,
  repeatingRequest.exposureBias,
  repeatingRequest.zoom,
  repeatingRequest.format
) {
  companion object {
    private const val TAG = "PhotoCaptureRequest"
  }

  override fun createCaptureRequest(
    device: CameraDevice,
    deviceDetails: CameraDeviceDetails,
    outputs: List<SurfaceOutput>
  ): CaptureRequest.Builder {
    val template = when (qualityPrioritization) {
      QualityPrioritization.QUALITY -> Template.PHOTO
      QualityPrioritization.BALANCED -> {
        if (deviceDetails.supportsZsl) {
          Template.PHOTO_ZSL
        } else {
          Template.PHOTO
        }
      }
      QualityPrioritization.SPEED -> {
        if (deviceDetails.supportsSnapshotCapture) {
          Template.PHOTO_SNAPSHOT
        } else if (deviceDetails.supportsZsl) {
          Template.PHOTO_ZSL
        } else {
          Template.PHOTO
        }
      }
    }
    Log.i(TAG, "Using CaptureRequest Template $template...")
    return this.createCaptureRequest(template, device, deviceDetails, outputs)
  }

  override fun createCaptureRequest(
    template: Template,
    device: CameraDevice,
    deviceDetails: CameraDeviceDetails,
    outputs: List<SurfaceOutput>
  ): CaptureRequest.Builder {
    val builder = super.createCaptureRequest(template, device, deviceDetails, outputs)

    // Set various speed vs quality optimization flags
    when (qualityPrioritization) {
      QualityPrioritization.SPEED -> {
        if (deviceDetails.hardwareLevel.isAtLeast(HardwareLevel.FULL)) {
          builder.set(CaptureRequest.COLOR_CORRECTION_MODE, CaptureRequest.COLOR_CORRECTION_MODE_FAST)
          if (deviceDetails.availableEdgeModes.contains(CaptureRequest.EDGE_MODE_FAST)) {
            builder.set(CaptureRequest.EDGE_MODE, CaptureRequest.EDGE_MODE_FAST)
          }
        }
        if (deviceDetails.availableAberrationModes.contains(CaptureRequest.COLOR_CORRECTION_ABERRATION_MODE_FAST)) {
          builder.set(CaptureRequest.COLOR_CORRECTION_ABERRATION_MODE, CaptureRequest.COLOR_CORRECTION_ABERRATION_MODE_FAST)
        }
        if (deviceDetails.availableHotPixelModes.contains(CaptureRequest.HOT_PIXEL_MODE_FAST)) {
          builder.set(CaptureRequest.HOT_PIXEL_MODE, CaptureRequest.HOT_PIXEL_MODE_FAST)
        }
        if (deviceDetails.availableDistortionCorrectionModes.contains(CaptureRequest.DISTORTION_CORRECTION_MODE_FAST) &&
          Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
        ) {
          builder.set(CaptureRequest.DISTORTION_CORRECTION_MODE, CaptureRequest.DISTORTION_CORRECTION_MODE_FAST)
        }
        if (deviceDetails.availableNoiseReductionModes.contains(CaptureRequest.NOISE_REDUCTION_MODE_FAST)) {
          builder.set(CaptureRequest.NOISE_REDUCTION_MODE, CaptureRequest.NOISE_REDUCTION_MODE_FAST)
        }
        if (deviceDetails.availableShadingModes.contains(CaptureRequest.SHADING_MODE_FAST)) {
          builder.set(CaptureRequest.SHADING_MODE, CaptureRequest.SHADING_MODE_FAST)
        }
        if (deviceDetails.availableToneMapModes.contains(CaptureRequest.TONEMAP_MODE_FAST)) {
          builder.set(CaptureRequest.TONEMAP_MODE, CaptureRequest.TONEMAP_MODE_FAST)
        }
        builder.set(CaptureRequest.JPEG_QUALITY, 85)
      }
      QualityPrioritization.BALANCED -> {
        builder.set(CaptureRequest.JPEG_QUALITY, 92)
      }
      QualityPrioritization.QUALITY -> {
        if (deviceDetails.hardwareLevel.isAtLeast(HardwareLevel.FULL)) {
          builder.set(CaptureRequest.COLOR_CORRECTION_MODE, CaptureRequest.COLOR_CORRECTION_MODE_HIGH_QUALITY)
          if (deviceDetails.availableEdgeModes.contains(CaptureRequest.EDGE_MODE_HIGH_QUALITY)) {
            builder.set(CaptureRequest.EDGE_MODE, CaptureRequest.EDGE_MODE_HIGH_QUALITY)
          }
        }
        if (deviceDetails.availableAberrationModes.contains(CaptureRequest.COLOR_CORRECTION_ABERRATION_MODE_HIGH_QUALITY)) {
          builder.set(CaptureRequest.COLOR_CORRECTION_ABERRATION_MODE, CaptureRequest.COLOR_CORRECTION_ABERRATION_MODE_HIGH_QUALITY)
        }
        if (deviceDetails.availableHotPixelModes.contains(CaptureRequest.HOT_PIXEL_MODE_HIGH_QUALITY)) {
          builder.set(CaptureRequest.HOT_PIXEL_MODE, CaptureRequest.HOT_PIXEL_MODE_HIGH_QUALITY)
        }
        if (deviceDetails.availableDistortionCorrectionModes.contains(CaptureRequest.DISTORTION_CORRECTION_MODE_HIGH_QUALITY) &&
          Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
        ) {
          builder.set(CaptureRequest.DISTORTION_CORRECTION_MODE, CaptureRequest.DISTORTION_CORRECTION_MODE_HIGH_QUALITY)
        }
        if (deviceDetails.availableNoiseReductionModes.contains(CaptureRequest.NOISE_REDUCTION_MODE_HIGH_QUALITY)) {
          builder.set(CaptureRequest.NOISE_REDUCTION_MODE, CaptureRequest.NOISE_REDUCTION_MODE_HIGH_QUALITY)
        }
        if (deviceDetails.availableShadingModes.contains(CaptureRequest.SHADING_MODE_HIGH_QUALITY)) {
          builder.set(CaptureRequest.SHADING_MODE, CaptureRequest.SHADING_MODE_HIGH_QUALITY)
        }
        if (deviceDetails.availableToneMapModes.contains(CaptureRequest.TONEMAP_MODE_HIGH_QUALITY)) {
          builder.set(CaptureRequest.TONEMAP_MODE, CaptureRequest.TONEMAP_MODE_HIGH_QUALITY)
        }
        builder.set(CaptureRequest.JPEG_QUALITY, 100)
      }
    }

    // Set JPEG Orientation
    val targetOrientation = outputOrientation.toSensorRelativeOrientation(deviceDetails)
    builder.set(CaptureRequest.JPEG_ORIENTATION, targetOrientation.toDegrees())

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
