package com.mrousavy.camera.core.capture

import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CaptureRequest
import android.os.Build
import android.util.Range
import com.mrousavy.camera.core.CameraDeviceDetails
import com.mrousavy.camera.core.InvalidFpsError
import com.mrousavy.camera.core.InvalidVideoStabilizationMode
import com.mrousavy.camera.core.PropRequiresFormatToBeNonNullError
import com.mrousavy.camera.core.outputs.SurfaceOutput
import com.mrousavy.camera.types.CameraDeviceFormat
import com.mrousavy.camera.types.HardwareLevel
import com.mrousavy.camera.types.Torch
import com.mrousavy.camera.types.VideoStabilizationMode

class RepeatingCaptureRequest(
  private val enableVideoPipeline: Boolean,
  torch: Torch = Torch.OFF,
  private val fps: Int? = null,
  private val videoStabilizationMode: VideoStabilizationMode = VideoStabilizationMode.OFF,
  enableVideoHdr: Boolean = false,
  enableLowLightBoost: Boolean = false,
  exposureBias: Double? = null,
  zoom: Float = 1.0f,
  format: CameraDeviceFormat? = null
) : CameraCaptureRequest(torch, enableVideoHdr, enableLowLightBoost, exposureBias, zoom, format) {
  override fun createCaptureRequest(
    device: CameraDevice,
    deviceDetails: CameraDeviceDetails,
    outputs: List<SurfaceOutput>
  ): CaptureRequest.Builder {
    val template = if (enableVideoPipeline) Template.RECORD else Template.PREVIEW
    return this.createCaptureRequest(template, device, deviceDetails, outputs)
  }

  private fun getBestDigitalStabilizationMode(deviceDetails: CameraDeviceDetails): Int {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      if (deviceDetails.digitalStabilizationModes.contains(CameraCharacteristics.CONTROL_VIDEO_STABILIZATION_MODE_PREVIEW_STABILIZATION)) {
        return CameraCharacteristics.CONTROL_VIDEO_STABILIZATION_MODE_PREVIEW_STABILIZATION
      }
    }
    return CameraCharacteristics.CONTROL_VIDEO_STABILIZATION_MODE_ON
  }

  override fun createCaptureRequest(
    template: Template,
    device: CameraDevice,
    deviceDetails: CameraDeviceDetails,
    outputs: List<SurfaceOutput>
  ): CaptureRequest.Builder {
    val builder = super.createCaptureRequest(template, device, deviceDetails, outputs)

    if (deviceDetails.modes.contains(CameraCharacteristics.CONTROL_MODE_AUTO)) {
      builder.set(CaptureRequest.CONTROL_MODE, CaptureRequest.CONTROL_MODE_AUTO)
    }

    // Set AF
    if (enableVideoPipeline && deviceDetails.afModes.contains(CameraCharacteristics.CONTROL_AF_MODE_CONTINUOUS_VIDEO)) {
      builder.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_VIDEO)
    } else if (deviceDetails.afModes.contains(CameraCharacteristics.CONTROL_AF_MODE_CONTINUOUS_PICTURE)) {
      builder.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE)
    } else if (deviceDetails.afModes.contains(CameraCharacteristics.CONTROL_AF_MODE_AUTO)) {
      builder.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_AUTO)
    } else if (deviceDetails.afModes.contains(CameraCharacteristics.CONTROL_AF_MODE_OFF)) {
      builder.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_OFF)
      builder.set(CaptureRequest.LENS_FOCUS_DISTANCE, 0f)
    }

    // Set AE
    if (deviceDetails.aeModes.contains(CameraCharacteristics.CONTROL_AE_MODE_ON)) {
      builder.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_ON)
    } else if (deviceDetails.aeModes.contains(CameraCharacteristics.CONTROL_AE_MODE_OFF)) {
      builder.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_OFF)
    }

    // Set AWB
    if (deviceDetails.awbModes.contains(CameraCharacteristics.CONTROL_AWB_MODE_AUTO)) {
      builder.set(CaptureRequest.CONTROL_AWB_MODE, CaptureRequest.CONTROL_AWB_MODE_AUTO)
    }

    // Set FPS
    if (fps != null) {
      if (format == null) throw PropRequiresFormatToBeNonNullError("fps")
      if (format.maxFps < fps) throw InvalidFpsError(fps)
      builder.set(CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE, Range(fps, fps))
    }

    // Set Video Stabilization
    if (videoStabilizationMode != VideoStabilizationMode.OFF) {
      if (format == null) throw PropRequiresFormatToBeNonNullError("videoStabilizationMode")
      if (!format.videoStabilizationModes.contains(videoStabilizationMode)) {
        throw InvalidVideoStabilizationMode(videoStabilizationMode)
      }
      when (videoStabilizationMode) {
        VideoStabilizationMode.STANDARD -> {
          builder.set(CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE, getBestDigitalStabilizationMode(deviceDetails))
        }
        VideoStabilizationMode.CINEMATIC, VideoStabilizationMode.CINEMATIC_EXTENDED -> {
          if (deviceDetails.hardwareLevel.isAtLeast(HardwareLevel.LIMITED)) {
            builder.set(CaptureRequest.LENS_OPTICAL_STABILIZATION_MODE, CaptureRequest.LENS_OPTICAL_STABILIZATION_MODE_ON)
          } else {
            builder.set(CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE, getBestDigitalStabilizationMode(deviceDetails))
          }
        }
        else -> throw InvalidVideoStabilizationMode(videoStabilizationMode)
      }
    }

    return builder
  }
}
