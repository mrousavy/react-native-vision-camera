package com.mrousavy.camera.parsers

import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.params.StreamConfigurationMap
import android.media.MediaRecorder
import android.util.Range
import android.util.Size
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.mrousavy.camera.utils.areUltimatelyEqual

fun parseCameraDeviceFormatId(size: Size, cameraConfig: StreamConfigurationMap, maxImageOutputSize: Size, fpsRanges: Array<Range<Int>>): WritableMap {
  val isHighestPhotoQualitySupported = areUltimatelyEqual(size, maxImageOutputSize)

  // Get the number of seconds that each frame will take to process
  val secondsPerFrame = cameraConfig.getOutputMinFrameDuration(MediaRecorder::class.java, size) / 1_000_000_000.0

  val frameRateRanges = Arguments.createArray()
  if (secondsPerFrame > 0) {
    val fps = (1.0 / secondsPerFrame).toInt()
    val frameRateRange = Arguments.createMap()
    frameRateRange.putInt("minFrameRate", 1)
    frameRateRange.putInt("maxFrameRate", fps)
    frameRateRanges.pushMap(frameRateRange)
  }
  fpsRanges.forEach { range ->
    val frameRateRange = Arguments.createMap()
    frameRateRange.putInt("minFrameRate", range.lower)
    frameRateRange.putInt("maxFrameRate", range.upper)
    frameRateRanges.pushMap(frameRateRange)
  }

  // TODO Revisit getAvailableCameraDevices (colorSpaces, more than YUV?)
  val colorSpaces = Arguments.createArray()
  colorSpaces.pushString("yuv")

  val videoStabilizationModes = Arguments.createArray()
  if (stabilizationModes.contains(CameraCharacteristics.CONTROL_VIDEO_STABILIZATION_MODE_OFF)) {
    videoStabilizationModes.pushString("off")
  }
  if (stabilizationModes.contains(CameraCharacteristics.CONTROL_VIDEO_STABILIZATION_MODE_ON)) {
    videoStabilizationModes.pushString("auto")
    videoStabilizationModes.pushString("standard")
  }

  val format = Arguments.createMap()
  format.putDouble("photoHeight", size.height.toDouble())
  format.putDouble("photoWidth", size.width.toDouble())
  format.putDouble("videoHeight", size.height.toDouble()) // TODO: Revisit getAvailableCameraDevices (videoHeight == photoHeight?)
  format.putDouble("videoWidth", size.width.toDouble()) // TODO: Revisit getAvailableCameraDevices (videoWidth == photoWidth?)
  format.putBoolean("isHighestPhotoQualitySupported", isHighestPhotoQualitySupported)
  format.putInt("maxISO", isoRange?.upper)
  format.putInt("minISO", isoRange?.lower)
  format.putDouble("fieldOfView", fieldOfView) // TODO: Revisit getAvailableCameraDevices (is fieldOfView accurate?)
  format.putDouble("maxZoom", (zoomRange?.upper ?: maxScalerZoom).toDouble())
  format.putArray("colorSpaces", colorSpaces)
  format.putBoolean("supportsVideoHDR", false) // TODO: supportsVideoHDR
  format.putBoolean("supportsPhotoHDR", supportsHdr)
  format.putArray("frameRateRanges", frameRateRanges)
  format.putString("autoFocusSystem", "none") // TODO: Revisit getAvailableCameraDevices (autoFocusSystem) (CameraCharacteristics.CONTROL_AF_AVAILABLE_MODES or CameraCharacteristics.LENS_INFO_FOCUS_DISTANCE_CALIBRATION)
  format.putArray("videoStabilizationModes", videoStabilizationModes)

  return format
}
