package com.mrousavy.camera.extensions

import android.graphics.Point
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.CaptureResult
import android.hardware.camera2.params.MeteringRectangle
import android.util.Log
import android.util.Size
import com.mrousavy.camera.core.CameraDeviceDetails
import com.mrousavy.camera.types.Flash
import com.mrousavy.camera.types.HardwareLevel

data class PrecaptureOptions(val modes: List<PrecaptureTrigger>, val flash: Flash = Flash.OFF, val pointsOfInterest: List<Point>)

data class PrecaptureResult(val needsFlash: Boolean)

private const val TAG = "Precapture"
private val DEFAULT_METERING_SIZE = Size(100, 100)

/**
 * Run a precapture sequence to trigger an AF, AE or AWB scan and lock to the optimal values.
 * After this function completes, you can capture high quality photos as AF/AE/AWB are in focused state.
 *
 * To reset to auto-focus again, create a new `RepeatingRequest` with a fresh set of CONTROL_MODEs set.
 */
suspend fun CameraCaptureSession.precapture(
  request: CaptureRequest.Builder,
  deviceDetails: CameraDeviceDetails,
  options: PrecaptureOptions
): PrecaptureResult {
  Log.i(TAG, "Running precapture sequence... ($options)")
  request.set(CaptureRequest.CONTROL_MODE, CaptureRequest.CONTROL_MODE_AUTO)

  var enableFlash = options.flash == Flash.ON

  // 1. Cancel any ongoing precapture sequences
  request.set(CaptureRequest.CONTROL_AF_TRIGGER, CaptureRequest.CONTROL_AF_TRIGGER_CANCEL)
  request.set(CaptureRequest.CONTROL_AE_PRECAPTURE_TRIGGER, CaptureRequest.CONTROL_AE_PRECAPTURE_TRIGGER_CANCEL)
  if (options.flash == Flash.AUTO) {
    // we want Auto-Flash, so check the current lighting conditions if we need it.
    val result = this.capture(request.build(), false)
    val aeState = result.get(CaptureResult.CONTROL_AE_STATE)
    if (aeState == CaptureResult.CONTROL_AE_STATE_FLASH_REQUIRED) {
      Log.i(TAG, "Auto-Flash: Flash is required for photo capture, enabling flash...")
      enableFlash = true
    } else {
      Log.i(TAG, "Auto-Flash: Flash is not required for photo capture.")
    }
  } else {
    // we either want Flash ON or OFF, so we don't care about lighting conditions - do a fast capture.
    this.capture(request.build(), null, null)
  }

  val meteringWeight = MeteringRectangle.METERING_WEIGHT_MAX - 1
  val meteringRectangles = options.pointsOfInterest.map { point ->
    MeteringRectangle(point, DEFAULT_METERING_SIZE, meteringWeight)
  }.toTypedArray()

  // 2. Submit a precapture start sequence
  if (enableFlash && deviceDetails.hasFlash) {
    request.set(CaptureRequest.FLASH_MODE, CaptureRequest.FLASH_MODE_TORCH)
  }
  if (options.modes.contains(PrecaptureTrigger.AF)) {
    // AF Precapture
    if (deviceDetails.afModes.contains(CaptureRequest.CONTROL_AF_MODE_AUTO)) {
      request.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_AUTO)
    }
    if (meteringRectangles.isNotEmpty() && deviceDetails.supportsFocusRegions) {
      request.set(CaptureRequest.CONTROL_AF_REGIONS, meteringRectangles)
    }
    request.set(CaptureRequest.CONTROL_AF_TRIGGER, CaptureRequest.CONTROL_AF_TRIGGER_START)
  }
  if (options.modes.contains(PrecaptureTrigger.AE) && deviceDetails.hardwareLevel.isAtLeast(HardwareLevel.LIMITED)) {
    // AE Precapture
    if (meteringRectangles.isNotEmpty() && deviceDetails.supportsExposureRegions) {
      request.set(CaptureRequest.CONTROL_AE_REGIONS, meteringRectangles)
    }
    request.set(CaptureRequest.CONTROL_AE_PRECAPTURE_TRIGGER, CaptureRequest.CONTROL_AE_PRECAPTURE_TRIGGER_START)
  }
  if (options.modes.contains(PrecaptureTrigger.AWB)) {
    // AWB Precapture
    if (meteringRectangles.isNotEmpty() && deviceDetails.supportsWhiteBalanceRegions) {
      request.set(CaptureRequest.CONTROL_AWB_REGIONS, meteringRectangles)
    }
  }
  this.capture(request.build(), null, null)

  // 3. Start a repeating request without the trigger and wait until AF/AE/AWB locks
  request.set(CaptureRequest.CONTROL_AF_TRIGGER, null)
  request.set(CaptureRequest.CONTROL_AE_PRECAPTURE_TRIGGER, null)
  val result = this.setRepeatingRequestAndWaitForPrecapture(request.build(), *options.modes.toTypedArray())

  Log.i(TAG, "AF/AE/AWB successfully locked!")
  // TODO: Set to idle again?

  val needsFlash = result.exposureState == ExposureState.FlashRequired
  return PrecaptureResult(needsFlash)
}
