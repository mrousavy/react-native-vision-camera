package com.mrousavy.camera.utils

import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraExtensionCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build
import android.util.Range
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.parsers.parseLensFacing

class CameraDevice(private val cameraManager: CameraManager, private val cameraId: String) {
  private val characteristics = cameraManager.getCameraCharacteristics(cameraId)
  private val hardwareLevel = characteristics.get(CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL) ?: CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY
  private val capabilities = characteristics.get(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES) ?: IntArray(0)
  private val extensions = getSupportedExtensions()

  // physical camera devices ([wide-angle, ultra-wide-angle, telephoto])
  val deviceTypes = characteristics.getDeviceTypes()

  // device characteristics
  val isMultiCam = capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_LOGICAL_MULTI_CAMERA)
  val supportsDepthCapture = capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_DEPTH_OUTPUT)
  val supportsRawCapture = capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_RAW)
  val supportsLowLightBoost = extensions.contains(CameraExtensionCharacteristics.EXTENSION_HDR)
  val lensFacing = characteristics.get(CameraCharacteristics.LENS_FACING)!!
  val hasFlash = characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) ?: false
  val name = (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) characteristics.get(CameraCharacteristics.INFO_VERSION)
              else null) ?: "${parseLensFacing(lensFacing)} (${cameraId})"

  // "formats" (all possible configurations for this device)
  private val zoomRange = (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) characteristics.get(CameraCharacteristics.CONTROL_ZOOM_RATIO_RANGE)
                           else null) ?: Range(1f, characteristics.get(CameraCharacteristics.SCALER_AVAILABLE_MAX_DIGITAL_ZOOM) ?: 1f)
  val minZoom = zoomRange.lower.toDouble()
  val maxZoom = zoomRange.upper.toDouble()

  val cameraConfig = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
  val isoRange = characteristics.get(CameraCharacteristics.SENSOR_INFO_SENSITIVITY_RANGE)
  val digitalStabilizationModes = characteristics.get(CameraCharacteristics.CONTROL_AVAILABLE_VIDEO_STABILIZATION_MODES) ?: IntArray(0)
  val opticalStabilizationModes = characteristics.get(CameraCharacteristics.LENS_INFO_AVAILABLE_OPTICAL_STABILIZATION) ?: IntArray(0)
  val fpsRanges = characteristics.get(CameraCharacteristics.CONTROL_AE_AVAILABLE_TARGET_FPS_RANGES) ?: emptyArray<Range<Int>>()
  val supportsHdr = extensions.contains(CameraExtensionCharacteristics.EXTENSION_HDR)

  // see https://developer.android.com/reference/android/hardware/camera2/CameraDevice#regular-capture
  val supportsParallelVideoProcessing = hardwareLevel != CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY && hardwareLevel != CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LIMITED

  // get extensions (HDR, Night Mode, ..)
  private fun getSupportedExtensions(): List<Int> {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val extensions = cameraManager.getCameraExtensionCharacteristics(cameraId)
      extensions.supportedExtensions
    } else {
      emptyList()
    }
  }

  private fun createFrameRateRanges(minFps: Int, maxFps: Int): ReadableArray {
    val array = Arguments.createArray()
    val map = Arguments.createMap()
    map.putInt("minFrameRate", minFps)
    map.putInt("maxFrameRate", maxFps)
    array.pushMap(map)
    return array
  }

  private fun getFormats(): ReadableArray {
    val array = Arguments.createArray()

    // TODO: Does that get all FPS ranges or only the slow-mo ones?
    val highSpeedFpsRanges = cameraConfig.highSpeedVideoFpsRanges

    cameraConfig.inputFormats.forEach { inputFormat ->
      val outputFormats = cameraConfig.getValidOutputFormatsForInput(inputFormat)
      val inputSizes = cameraConfig.getInputSizes(inputFormat)

      outputFormats.forEach { outputFormat ->

        val outputSizes = cameraConfig.getOutputSizes(outputFormat)
        val highResSizes = cameraConfig.getHighResolutionOutputSizes(outputFormat)

        outputSizes.forEach { outputSize ->
          fpsRanges.forEach { fpsRange ->

            val map = Arguments.createMap()
            map.putInt("photoHeight", outputSize.height)
            map.putInt("photoWidth", outputSize.width)
            //map.putBoolean("isHighestPhotoQualitySupported", highResSizes.contains(outputSize))
            map.putInt("maxISO", 99) // TODO
            map.putInt("minISO", 99) // TODO
            map.putInt("fieldOfView", 99) // TODO
            // TODO: colorSpaces
            // TODO: supportsVideoHDR
            // TODO: supportsPhotoHDR
            // TODO: autoFocusSystem
            // TODO: videoStabilizationModes
            // TODO: pixelFormat
            map.putArray("frameRateRanges", createFrameRateRanges(fpsRange.lower, fpsRange.upper))
          }

          highSpeedFpsRanges.forEach { fpsRange ->
            val highSpeedSizes = cameraConfig.getHighSpeedVideoSizesFor(fpsRange)
          }
        }
      }
    }

    return array
  }

  // convert to React Native JS object (map)
  fun toMap(): ReadableMap {
    val map = Arguments.createMap()
    map.putString("id", cameraId)
    map.putArray("devices", deviceTypes)
    map.putString("position", parseLensFacing(lensFacing))
    map.putString("name", name)
    map.putBoolean("hasFlash", hasFlash)
    map.putBoolean("hasTorch", hasFlash)
    map.putBoolean("isMultiCam", isMultiCam)
    map.putBoolean("supportsParallelVideoProcessing", supportsParallelVideoProcessing)
    map.putBoolean("supportsRawCapture", supportsRawCapture)
    map.putBoolean("supportsDepthCapture", supportsDepthCapture)
    map.putBoolean("supportsLowLightBoost", supportsLowLightBoost)
    map.putBoolean("supportsFocus", true) // I believe every device here supports focussing
    map.putDouble("minZoom", minZoom)
    map.putDouble("maxZoom", maxZoom)
    map.putDouble("neutralZoom", 1.0) // Zoom is always relative to 1.0 on Android

    map.putArray("formats", getFormats())

    return map
  }
}
