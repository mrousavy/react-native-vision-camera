package com.mrousavy.camera.utils

import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraExtensionCharacteristics
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CameraMetadata
import android.hardware.camera2.params.DynamicRangeProfiles
import android.os.Build
import android.util.Range
import android.util.Size
import androidx.camera.core.CameraSelector
import androidx.camera.extensions.ExtensionMode
import androidx.camera.extensions.ExtensionsManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.parsers.bigger
import com.mrousavy.camera.parsers.parseImageFormat
import com.mrousavy.camera.parsers.parseLensFacing
import com.mrousavy.camera.parsers.parseVideoStabilizationMode
import kotlin.math.PI
import kotlin.math.atan

class CameraDevice(private val cameraManager: CameraManager, extensionsManager: ExtensionsManager, private val cameraId: String) {
  private val cameraSelector = CameraSelector.Builder().byID(cameraId).build()
  private val characteristics = cameraManager.getCameraCharacteristics(cameraId)
  private val hardwareLevel = characteristics.get(CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL) ?: CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY
  private val capabilities = characteristics.get(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES) ?: IntArray(0)
  private val extensions = getSupportedExtensions()

  // device characteristics
  private val isMultiCam = capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_LOGICAL_MULTI_CAMERA)
  private val supportsDepthCapture = capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_DEPTH_OUTPUT)
  private val supportsRawCapture = capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_RAW)
  private val supportsLowLightBoost = extensionsManager.isExtensionAvailable(cameraSelector, ExtensionMode.NIGHT) || extensions.contains(CameraExtensionCharacteristics.EXTENSION_NIGHT)
  private val lensFacing = characteristics.get(CameraCharacteristics.LENS_FACING)!!
  private val hasFlash = characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) ?: false
  private val focalLengths = characteristics.get(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS) ?: FloatArray(0)
  private val sensorSize = characteristics.get(CameraCharacteristics.SENSOR_INFO_PHYSICAL_SIZE)!!
  private val name = (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) characteristics.get(CameraCharacteristics.INFO_VERSION)
                      else null) ?: "${parseLensFacing(lensFacing)} (${cameraId})"

  // "formats" (all possible configurations for this device)
  private val zoomRange = (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) characteristics.get(CameraCharacteristics.CONTROL_ZOOM_RATIO_RANGE)
                           else null) ?: Range(1f, characteristics.get(CameraCharacteristics.SCALER_AVAILABLE_MAX_DIGITAL_ZOOM) ?: 1f)
  private val minZoom = zoomRange.lower.toDouble()
  private val maxZoom = zoomRange.upper.toDouble()

  private val cameraConfig = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
  private val isoRange = characteristics.get(CameraCharacteristics.SENSOR_INFO_SENSITIVITY_RANGE) ?: Range(0, 0)
  private val digitalStabilizationModes = characteristics.get(CameraCharacteristics.CONTROL_AVAILABLE_VIDEO_STABILIZATION_MODES) ?: IntArray(0)
  private val opticalStabilizationModes = characteristics.get(CameraCharacteristics.LENS_INFO_AVAILABLE_OPTICAL_STABILIZATION) ?: IntArray(0)
  private val supportsPhotoHdr = extensionsManager.isExtensionAvailable(cameraSelector, ExtensionMode.HDR) || extensions.contains(CameraExtensionCharacteristics.EXTENSION_HDR)
  private val supportsVideoHdr = getHasVideoHdr()

  // see https://developer.android.com/reference/android/hardware/camera2/CameraDevice#regular-capture
  private val supportsParallelVideoProcessing = hardwareLevel != CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY && hardwareLevel != CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LIMITED

  // get extensions (HDR, Night Mode, ..)
  private fun getSupportedExtensions(): List<Int> {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val extensions = cameraManager.getCameraExtensionCharacteristics(cameraId)
      extensions.supportedExtensions
    } else {
      emptyList()
    }
  }

  private fun getHasVideoHdr(): Boolean {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      if (capabilities.contains(CameraMetadata.REQUEST_AVAILABLE_CAPABILITIES_DYNAMIC_RANGE_TEN_BIT)) {
        val availableProfiles = characteristics.get(CameraCharacteristics.REQUEST_AVAILABLE_DYNAMIC_RANGE_PROFILES)
          ?: DynamicRangeProfiles(LongArray(0))
        return availableProfiles.supportedProfiles.contains(DynamicRangeProfiles.HLG10)
      }
    }
    return false
  }

  private fun createFrameRateRanges(ranges: Array<Range<Int>>): ReadableArray {
    val array = Arguments.createArray()
    ranges.forEach { range ->
      val map = Arguments.createMap()
      map.putInt("minFrameRate", range.lower)
      map.putInt("maxFrameRate", range.upper)
      array.pushMap(map)
    }
    return array
  }

  private fun createFrameRateRanges(minFps: Int, maxFps: Int): ReadableArray {
    return createFrameRateRanges(arrayOf(Range(minFps, maxFps)))
  }

  private fun createColorSpaces(): ReadableArray {
    val array = Arguments.createArray()
    array.pushString("yuv")
    return array
  }

  private fun createStabilizationModes(): ReadableArray {
    val array = Arguments.createArray()
    val videoStabilizationModes = digitalStabilizationModes.plus(opticalStabilizationModes)
    videoStabilizationModes.forEach { videoStabilizationMode ->
      array.pushString(parseVideoStabilizationMode(videoStabilizationMode))
    }
    return array
  }


  // 35mm is 135 film format, a standard in which focal lengths are usually measured
  private val size35mm = Size(36, 24)

  private fun getDeviceTypes(): ReadableArray {
    // TODO: Check if getDeviceType() works correctly, even for logical multi-cameras

    // To get valid focal length standards we have to upscale to the 35mm measurement (film standard)
    val cropFactor = size35mm.bigger / sensorSize.bigger

    val deviceTypes = Arguments.createArray()

    // https://en.wikipedia.org/wiki/Telephoto_lens
    val containsTelephoto = focalLengths.any { l -> (l * cropFactor) > 35 } // TODO: Telephoto lenses are > 85mm, but we don't have anything between that range..
    // val containsNormalLens = focalLengths.any { l -> (l * cropFactor) > 35 && (l * cropFactor) <= 55 }
    // https://en.wikipedia.org/wiki/Wide-angle_lens
    val containsWideAngle = focalLengths.any { l -> (l * cropFactor) >= 24 && (l * cropFactor) <= 35 }
    // https://en.wikipedia.org/wiki/Ultra_wide_angle_lens
    val containsUltraWideAngle = focalLengths.any { l -> (l * cropFactor) < 24 }

    if (containsTelephoto)
      deviceTypes.pushString("telephoto-camera")
    if (containsWideAngle)
      deviceTypes.pushString("wide-angle-camera")
    if (containsUltraWideAngle)
      deviceTypes.pushString("ultra-wide-angle-camera")

    return deviceTypes
  }

  private fun getFieldOfView(): Double {
    return 2 * atan(sensorSize.bigger / (focalLengths[0] * 2)) * (180 / PI)
  }

  private fun buildFormatMap(outputSize: Size, outputFormat: Int, fpsRanges: ReadableArray): ReadableMap {
    val highResSizes = (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) cameraConfig.getHighResolutionOutputSizes(outputFormat) else null) ?: emptyArray()

    val map = Arguments.createMap()
    map.putInt("photoHeight", outputSize.height)
    map.putInt("photoWidth", outputSize.width)
    map.putInt("videoHeight", outputSize.height)
    map.putInt("videoWidth", outputSize.width)
    map.putBoolean("isHighestPhotoQualitySupported", highResSizes.contains(outputSize))
    map.putInt("maxISO", isoRange.upper)
    map.putInt("minISO", isoRange.lower)
    map.putDouble("fieldOfView", getFieldOfView())
    map.putArray("colorSpaces", createColorSpaces())
    map.putBoolean("supportsVideoHDR", supportsVideoHdr)
    map.putBoolean("supportsPhotoHDR", supportsPhotoHdr)
    map.putString("autoFocusSystem", "contrast-detection") // TODO: Is this wrong?
    map.putArray("videoStabilizationModes", createStabilizationModes())
    map.putString("pixelFormat", parseImageFormat(outputFormat))
    map.putArray("frameRateRanges", fpsRanges)
    return map
  }

  private fun getFormats(): ReadableArray {
    val array = Arguments.createArray()

    val highSpeedSizes = cameraConfig.highSpeedVideoSizes

    val outputFormats = cameraConfig.outputFormats
    outputFormats.forEach { outputFormat ->
      // Normal Video/Photo Sizes
      val outputSizes = cameraConfig.getOutputSizes(outputFormat)
      outputSizes.forEach { outputSize ->
        val frameDuration = cameraConfig.getOutputMinFrameDuration(outputFormat, outputSize)
        val maxFps = (1.0 / (frameDuration.toDouble() / 1000000000)).toInt()
        val minFps = 1

        val map = buildFormatMap(outputSize, outputFormat, createFrameRateRanges(minFps, maxFps))
        array.pushMap(map)
      }

      // High-Speed (Slow Motion) Video Sizes
      highSpeedSizes.forEach { outputSize ->
        val highSpeedRanges = cameraConfig.getHighSpeedVideoFpsRangesFor(outputSize)

        val map = buildFormatMap(outputSize, outputFormat, createFrameRateRanges(highSpeedRanges))
        array.pushMap(map)
      }
    }

    return array
  }

  // convert to React Native JS object (map)
  fun toMap(): ReadableMap {
    val map = Arguments.createMap()
    map.putString("id", cameraId)
    map.putArray("devices", getDeviceTypes())
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
