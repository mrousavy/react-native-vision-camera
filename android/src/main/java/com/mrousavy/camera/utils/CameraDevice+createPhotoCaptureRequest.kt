package com.mrousavy.camera.utils

import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureRequest
import android.os.Build
import android.view.Surface


enum class FlashMode { OFF, ON, AUTO }

enum class QualityPrioritization { SPEED, BALANCED, QUALITY }

private fun supportsDeviceZsl(capabilities: IntArray): Boolean {
  if (capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_PRIVATE_REPROCESSING)) return true
  if (capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_YUV_REPROCESSING)) return true
  return false
}

fun CameraDevice.createPhotoCaptureRequest(cameraManager: CameraManager,
                                           surface: Surface,
                                           qualityPrioritization: QualityPrioritization,
                                           flashMode: FlashMode,
                                           enableRedEyeReduction: Boolean,
                                           enableAutoStabilization: Boolean): CaptureRequest {
  val cameraCharacteristics = cameraManager.getCameraCharacteristics(this.id)
  val capabilities = cameraCharacteristics.get(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES)!!

  val captureRequest = when (qualityPrioritization) {
    // If speed, create application-specific Zero-Shutter-Lag template
    QualityPrioritization.SPEED -> this.createCaptureRequest(CameraDevice.TEMPLATE_ZERO_SHUTTER_LAG)
    // Otherwise create standard still image capture template
    else -> this.createCaptureRequest(CameraDevice.TEMPLATE_STILL_CAPTURE)
  }
  if (qualityPrioritization == QualityPrioritization.SPEED) {
    // Some devices also support hardware Zero-Shutter-Lag, try enabling that
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && supportsDeviceZsl(capabilities)) {
      captureRequest[CaptureRequest.CONTROL_ENABLE_ZSL] = true
    }
  }

  // TODO: Maybe we can even expose that prop directly?
  val jpegQuality = when (qualityPrioritization) {
    QualityPrioritization.SPEED -> 85
    QualityPrioritization.BALANCED -> 92
    QualityPrioritization.QUALITY -> 100
  }.toByte()
  captureRequest[CaptureRequest.JPEG_QUALITY] = jpegQuality

  // TODO: CaptureRequest.JPEG_ORIENTATION maybe?

  when (flashMode) {
    // Set the Flash Mode
    FlashMode.OFF -> {
      captureRequest[CaptureRequest.FLASH_MODE] = CaptureRequest.FLASH_MODE_OFF
      captureRequest[CaptureRequest.CONTROL_AE_MODE] = CaptureRequest.CONTROL_AE_MODE_ON
    }
    FlashMode.ON -> {
      captureRequest[CaptureRequest.FLASH_MODE] = CaptureRequest.FLASH_MODE_SINGLE
      captureRequest[CaptureRequest.CONTROL_AE_MODE] = CaptureRequest.CONTROL_AE_MODE_ON_ALWAYS_FLASH
    }
    FlashMode.AUTO -> {
      if (enableRedEyeReduction) {
        captureRequest[CaptureRequest.CONTROL_AE_MODE] = CaptureRequest.CONTROL_AE_MODE_ON_AUTO_FLASH_REDEYE
      } else {
        captureRequest[CaptureRequest.CONTROL_AE_MODE] = CaptureRequest.CONTROL_AE_MODE_ON_AUTO_FLASH
      }
    }
  }

  if (enableAutoStabilization) {
    // Enable optical or digital image stabilization
    val digitalStabilization = cameraCharacteristics.get(CameraCharacteristics.CONTROL_AVAILABLE_VIDEO_STABILIZATION_MODES)
    val hasDigitalStabilization = digitalStabilization?.contains(CameraCharacteristics.CONTROL_VIDEO_STABILIZATION_MODE_ON) ?: false

    val opticalStabilization = cameraCharacteristics.get(CameraCharacteristics.LENS_INFO_AVAILABLE_OPTICAL_STABILIZATION)
    val hasOpticalStabilization = opticalStabilization?.contains(CameraCharacteristics.LENS_OPTICAL_STABILIZATION_MODE_ON) ?: false
    if (hasOpticalStabilization) {
      captureRequest[CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE] = CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE_OFF
      captureRequest[CaptureRequest.LENS_OPTICAL_STABILIZATION_MODE] = CaptureRequest.LENS_OPTICAL_STABILIZATION_MODE_ON
    } else if (hasDigitalStabilization) {
      captureRequest[CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE] = CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE_ON
    } else {
      // no stabilization is supported. ignore it
    }
  }

  captureRequest.addTarget(surface)

  return captureRequest.build()
}
