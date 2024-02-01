package com.mrousavy.camera.core

import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CaptureRequest
import android.util.Range
import com.mrousavy.camera.core.outputs.SurfaceOutput
import com.mrousavy.camera.extensions.setZoom
import com.mrousavy.camera.types.CameraDeviceFormat
import com.mrousavy.camera.types.Torch
import com.mrousavy.camera.types.VideoStabilizationMode

data class RepeatingRequest(
  private val template: Template = Template.PREVIEW,
  private val torch: Torch = Torch.OFF,
  private val fps: Int? = null,
  private val videoStabilizationMode: VideoStabilizationMode = VideoStabilizationMode.OFF,
  private val enableVideoHdr: Boolean = false,
  private val enableLowLightBoost: Boolean = false,
  private val exposureBias: Double? = null,
  private val zoom: Float = 1.0f,
  private val format: CameraDeviceFormat? = null
) {
  enum class Template {
    RECORD,
    PREVIEW;

    fun toRequestTemplate(): Int =
      when (this) {
        RECORD -> CameraDevice.TEMPLATE_RECORD
        PREVIEW -> CameraDevice.TEMPLATE_PREVIEW
      }
  }

  fun toRepeatingRequest(device: CameraDevice, deviceDetails: CameraDeviceDetails, outputs: List<SurfaceOutput>): CaptureRequest {
    val captureRequest = device.createCaptureRequest(template.toRequestTemplate())

    outputs.forEach { output ->
      if (output.isRepeating) {
        captureRequest.addTarget(output.surface)
      }
    }

    // Set FPS
    if (fps != null) {
      if (format == null) throw PropRequiresFormatToBeNonNullError("fps")
      if (format.maxFps < fps) throw InvalidFpsError(fps)
      captureRequest.set(CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE, Range(fps, fps))
    }

    // Set Video Stabilization
    if (videoStabilizationMode != VideoStabilizationMode.OFF) {
      if (format == null) throw PropRequiresFormatToBeNonNullError("videoStabilizationMode")
      if (!format.videoStabilizationModes.contains(videoStabilizationMode)) {
        throw InvalidVideoStabilizationMode(videoStabilizationMode)
      }
    }
    when (videoStabilizationMode) {
      VideoStabilizationMode.OFF -> {
        // do nothing
      }
      VideoStabilizationMode.STANDARD -> {
        // TODO: Use CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE_PREVIEW_STABILIZATION?
        captureRequest.set(CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE, CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE_ON)
      }
      VideoStabilizationMode.CINEMATIC, VideoStabilizationMode.CINEMATIC_EXTENDED -> {
        captureRequest.set(CaptureRequest.LENS_OPTICAL_STABILIZATION_MODE, CaptureRequest.LENS_OPTICAL_STABILIZATION_MODE_ON)
      }
    }

    // Set HDR
    if (enableVideoHdr) {
      if (format == null) throw PropRequiresFormatToBeNonNullError("videoHdr")
      if (!format.supportsVideoHdr) throw InvalidVideoHdrError()
      captureRequest.set(CaptureRequest.CONTROL_SCENE_MODE, CaptureRequest.CONTROL_SCENE_MODE_HDR)
    } else if (enableLowLightBoost) {
      if (!deviceDetails.supportsLowLightBoost) throw LowLightBoostNotSupportedError()
      captureRequest.set(CaptureRequest.CONTROL_SCENE_MODE, CaptureRequest.CONTROL_SCENE_MODE_NIGHT)
    }

    // Set Exposure Bias
    if (exposureBias != null) {
      val clamped = deviceDetails.exposureRange.clamp(exposureBias.toInt())
      captureRequest.set(CaptureRequest.CONTROL_AE_EXPOSURE_COMPENSATION, clamped)
    }

    // Set Zoom
    captureRequest.setZoom(zoom, deviceDetails.characteristics)

    // Set Torch
    if (torch == Torch.ON) {
      if (!deviceDetails.hasFlash) throw FlashUnavailableError()
      captureRequest.set(CaptureRequest.FLASH_MODE, CaptureRequest.FLASH_MODE_TORCH)
    }

    // Start repeating request if the Camera is active
    return captureRequest.build()
  }
}
