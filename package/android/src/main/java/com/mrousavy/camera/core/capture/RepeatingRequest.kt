package com.mrousavy.camera.core.capture

import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CaptureRequest
import android.util.Range
import com.mrousavy.camera.core.CameraDeviceDetails
import com.mrousavy.camera.core.FlashUnavailableError
import com.mrousavy.camera.core.InvalidFpsError
import com.mrousavy.camera.core.InvalidVideoHdrError
import com.mrousavy.camera.core.InvalidVideoStabilizationMode
import com.mrousavy.camera.core.LowLightBoostNotSupportedError
import com.mrousavy.camera.core.PropRequiresFormatToBeNonNullError
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
): CaptureRequestGenerator {
  enum class Template {
    RECORD,
    PREVIEW;

    fun toRequestTemplate(): Int =
      when (this) {
        RECORD -> CameraDevice.TEMPLATE_RECORD
        PREVIEW -> CameraDevice.TEMPLATE_PREVIEW
      }
  }

  override fun createCaptureRequest(device: CameraDevice): CaptureRequest.Builder {
    return device.createCaptureRequest(template.toRequestTemplate())
  }

  // TODO: Remove outputs and cameraDeviceDetails from here to cache them?
  override fun applyToCaptureRequest(builder: CaptureRequest.Builder, outputs: List<SurfaceOutput>, cameraDeviceDetails: CameraDeviceDetails) {
    // Add all repeating output surfaces
    outputs.forEach { output ->
      if (output.isRepeating) {
        builder.addTarget(output.surface)
      }
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
    }
    when (videoStabilizationMode) {
      VideoStabilizationMode.OFF -> {
        // do nothing
      }
      VideoStabilizationMode.STANDARD -> {
        // TODO: Use CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE_PREVIEW_STABILIZATION?
        builder.set(CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE, CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE_ON)
      }
      VideoStabilizationMode.CINEMATIC, VideoStabilizationMode.CINEMATIC_EXTENDED -> {
        builder.set(CaptureRequest.LENS_OPTICAL_STABILIZATION_MODE, CaptureRequest.LENS_OPTICAL_STABILIZATION_MODE_ON)
      }
    }

    // Set HDR
    if (enableVideoHdr) {
      if (format == null) throw PropRequiresFormatToBeNonNullError("videoHdr")
      if (!format.supportsVideoHdr) throw InvalidVideoHdrError()
      builder.set(CaptureRequest.CONTROL_SCENE_MODE, CaptureRequest.CONTROL_SCENE_MODE_HDR)
    } else if (enableLowLightBoost) {
      if (!cameraDeviceDetails.supportsLowLightBoost) throw LowLightBoostNotSupportedError()
      builder.set(CaptureRequest.CONTROL_SCENE_MODE, CaptureRequest.CONTROL_SCENE_MODE_NIGHT)
    }

    // Set Exposure Bias
    if (exposureBias != null) {
      val clamped = cameraDeviceDetails.exposureRange.clamp(exposureBias.toInt())
      builder.set(CaptureRequest.CONTROL_AE_EXPOSURE_COMPENSATION, clamped)
    }

    // Set Zoom
    builder.setZoom(zoom, cameraDeviceDetails.characteristics)

    // Set Torch
    if (torch == Torch.ON) {
      if (!cameraDeviceDetails.hasFlash) throw FlashUnavailableError()
      builder.set(CaptureRequest.FLASH_MODE, CaptureRequest.FLASH_MODE_TORCH)
    }
  }
}
