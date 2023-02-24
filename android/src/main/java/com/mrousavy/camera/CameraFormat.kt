package com.mrousavy.camera

import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraExtensionCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build
import android.util.Range
import com.facebook.react.bridge.Arguments

class CameraFormat(private val cameraManager: CameraManager, private val cameraId: String) {
  private val characteristics = cameraManager.getCameraCharacteristics(cameraId)

  val cameraConfig = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
  val isoRange = characteristics.get(CameraCharacteristics.SENSOR_INFO_SENSITIVITY_RANGE)
  val digitalStabilizationModes = characteristics.get(CameraCharacteristics.CONTROL_AVAILABLE_VIDEO_STABILIZATION_MODES) ?: IntArray(0)
  val opticalStabilizationModes = characteristics.get(CameraCharacteristics.LENS_INFO_AVAILABLE_OPTICAL_STABILIZATION) ?: IntArray(0)
  val fpsRanges = characteristics.get(CameraCharacteristics.CONTROL_AE_AVAILABLE_TARGET_FPS_RANGES) ?: emptyArray<Range<Int>>()
  val supportsHdr = false // extensions.contains(CameraExtensionCharacteristics.EXTENSION_HDR)


  fun toMap() {
    val map = Arguments.createMap()

    cameraConfig.inputFormats.forEach { inputFormat ->
      val outputFormats = cameraConfig.getValidOutputFormatsForInput(inputFormat)
      val inputSizes = cameraConfig.getInputSizes(inputFormat)

      outputFormats.forEach { outputFormat ->
        val highResSizes = cameraConfig.getHighResolutionOutputSizes(outputFormat) ?: cameraConfig.getOutputSizes(outputFormat)
        val highSpeedSizes = cameraConfig.highSpeedVideoFpsRanges.flatMap { cameraConfig.getHighSpeedVideoSizesFor(it).asIterable() }
      }
    }
  }
}
