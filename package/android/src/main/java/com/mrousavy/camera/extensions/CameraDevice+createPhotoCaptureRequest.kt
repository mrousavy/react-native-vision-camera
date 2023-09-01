package com.mrousavy.camera.extensions

import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureRequest
import android.os.Build
import android.view.Surface
import com.mrousavy.camera.parsers.Flash
import com.mrousavy.camera.parsers.Orientation
import com.mrousavy.camera.parsers.QualityPrioritization

private fun supportsSnapshotCapture(cameraCharacteristics: CameraCharacteristics): Boolean {
  // As per CameraDevice.TEMPLATE_VIDEO_SNAPSHOT in documentation:
  val hardwareLevel = cameraCharacteristics.get(CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL)!!
  if (hardwareLevel == CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY) return false

  val capabilities = cameraCharacteristics.get(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES)!!
  val hasDepth = capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_DEPTH_OUTPUT)
  val isBackwardsCompatible = !capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_BACKWARD_COMPATIBLE)
  if (hasDepth && !isBackwardsCompatible) return false

  return true
}

fun CameraDevice.createPhotoCaptureRequest(cameraManager: CameraManager,
                                           surface: Surface,
                                           zoom: Float,
                                           qualityPrioritization: QualityPrioritization,
                                           flashMode: Flash,
                                           enableRedEyeReduction: Boolean,
                                           enableAutoStabilization: Boolean,
                                           orientation: Orientation): CaptureRequest {
  val cameraCharacteristics = cameraManager.getCameraCharacteristics(this.id)

  val template = if (qualityPrioritization == QualityPrioritization.SPEED && supportsSnapshotCapture(cameraCharacteristics)) {
    CameraDevice.TEMPLATE_VIDEO_SNAPSHOT
  } else {
    CameraDevice.TEMPLATE_STILL_CAPTURE
  }
  val captureRequest = this.createCaptureRequest(template)

  // TODO: Maybe we can even expose that prop directly?
  val jpegQuality = when (qualityPrioritization) {
    QualityPrioritization.SPEED -> 85
    QualityPrioritization.BALANCED -> 92
    QualityPrioritization.QUALITY -> 100
  }
  captureRequest.set(CaptureRequest.JPEG_QUALITY, jpegQuality.toByte())

  captureRequest.set(CaptureRequest.JPEG_ORIENTATION, orientation.toDegrees())

  when (flashMode) {
    // Set the Flash Mode
    Flash.OFF -> {
      captureRequest.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_ON)
    }
    Flash.ON -> {
      captureRequest.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_ON_ALWAYS_FLASH)
    }
    Flash.AUTO -> {
      if (enableRedEyeReduction) {
        captureRequest.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_ON_AUTO_FLASH_REDEYE)
      } else {
        captureRequest.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_ON_AUTO_FLASH)
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
      captureRequest.set(CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE, CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE_OFF)
      captureRequest.set(CaptureRequest.LENS_OPTICAL_STABILIZATION_MODE, CaptureRequest.LENS_OPTICAL_STABILIZATION_MODE_ON)
    } else if (hasDigitalStabilization) {
      captureRequest.set(CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE, CaptureRequest.CONTROL_VIDEO_STABILIZATION_MODE_ON)
    } else {
      // no stabilization is supported. ignore it
    }
  }

  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
    captureRequest.set(CaptureRequest.CONTROL_ZOOM_RATIO, zoom)
  } else {
    val size = cameraCharacteristics.get(CameraCharacteristics.SENSOR_INFO_ACTIVE_ARRAY_SIZE)!!
    captureRequest.set(CaptureRequest.SCALER_CROP_REGION, size.zoomed(zoom))
  }

  captureRequest.addTarget(surface)

  return captureRequest.build()
}
