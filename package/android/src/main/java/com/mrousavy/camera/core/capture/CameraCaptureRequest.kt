package com.mrousavy.camera.core.capture

import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CaptureRequest
import com.mrousavy.camera.core.CameraDeviceDetails
import com.mrousavy.camera.core.FlashUnavailableError
import com.mrousavy.camera.core.InvalidVideoHdrError
import com.mrousavy.camera.core.LowLightBoostNotSupportedError
import com.mrousavy.camera.core.PropRequiresFormatToBeNonNullError
import com.mrousavy.camera.core.outputs.SurfaceOutput
import com.mrousavy.camera.extensions.setZoom
import com.mrousavy.camera.types.CameraDeviceFormat
import com.mrousavy.camera.types.Torch

abstract class CameraCaptureRequest(
  private val torch: Torch = Torch.OFF,
  private val enableVideoHdr: Boolean = false,
  val enableLowLightBoost: Boolean = false,
  val exposureBias: Double? = null,
  val zoom: Float = 1.0f,
  val format: CameraDeviceFormat? = null
) {
  enum class Template {
    RECORD,
    PHOTO,
    PHOTO_ZSL,
    PHOTO_SNAPSHOT,
    PREVIEW;

    fun toRequestTemplate(): Int =
      when (this) {
        RECORD -> CameraDevice.TEMPLATE_RECORD
        PHOTO -> CameraDevice.TEMPLATE_STILL_CAPTURE
        PHOTO_ZSL -> CameraDevice.TEMPLATE_ZERO_SHUTTER_LAG
        PHOTO_SNAPSHOT -> CameraDevice.TEMPLATE_VIDEO_SNAPSHOT
        PREVIEW -> CameraDevice.TEMPLATE_PREVIEW
      }
  }

  abstract fun createCaptureRequest(
    device: CameraDevice,
    deviceDetails: CameraDeviceDetails,
    outputs: List<SurfaceOutput>
  ): CaptureRequest.Builder

  protected open fun createCaptureRequest(
    template: Template,
    device: CameraDevice,
    deviceDetails: CameraDeviceDetails,
    outputs: List<SurfaceOutput>
  ): CaptureRequest.Builder {
    val builder = device.createCaptureRequest(template.toRequestTemplate())

    // Add all repeating output surfaces
    outputs.forEach { output ->
      builder.addTarget(output.surface)
    }

    // Set HDR
    if (enableVideoHdr) {
      if (format == null) throw PropRequiresFormatToBeNonNullError("videoHdr")
      if (!format.supportsVideoHdr) throw InvalidVideoHdrError()
      builder.set(CaptureRequest.CONTROL_SCENE_MODE, CaptureRequest.CONTROL_SCENE_MODE_HDR)
      builder.set(CaptureRequest.CONTROL_MODE, CaptureRequest.CONTROL_MODE_USE_SCENE_MODE)
    } else if (enableLowLightBoost) {
      if (!deviceDetails.supportsLowLightBoost) throw LowLightBoostNotSupportedError()
      builder.set(CaptureRequest.CONTROL_SCENE_MODE, CaptureRequest.CONTROL_SCENE_MODE_NIGHT)
      builder.set(CaptureRequest.CONTROL_MODE, CaptureRequest.CONTROL_MODE_USE_SCENE_MODE)
    }

    // Set Exposure Bias
    if (exposureBias != null) {
      val clamped = deviceDetails.exposureRange.clamp(exposureBias.toInt())
      builder.set(CaptureRequest.CONTROL_AE_EXPOSURE_COMPENSATION, clamped)
    }

    // Set Zoom
    builder.setZoom(zoom, deviceDetails)

    // Set Torch
    if (torch == Torch.ON) {
      if (!deviceDetails.hasFlash) throw FlashUnavailableError()
      builder.set(CaptureRequest.FLASH_MODE, CaptureRequest.FLASH_MODE_TORCH)
    }

    return builder
  }
}
