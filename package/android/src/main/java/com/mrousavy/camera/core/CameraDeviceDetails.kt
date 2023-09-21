package com.mrousavy.camera.core

import android.graphics.ImageFormat
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CameraMetadata
import android.hardware.camera2.params.DynamicRangeProfiles
import android.os.Build
import android.util.Range
import android.util.Size
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.extensions.bigger
import com.mrousavy.camera.extensions.getPhotoSizes
import com.mrousavy.camera.extensions.getVideoSizes
import com.mrousavy.camera.parsers.HardwareLevel
import com.mrousavy.camera.parsers.LensFacing
import com.mrousavy.camera.parsers.Orientation
import com.mrousavy.camera.parsers.PixelFormat
import com.mrousavy.camera.parsers.VideoStabilizationMode
import kotlin.math.PI
import kotlin.math.atan

class CameraDeviceDetails(private val cameraManager: CameraManager, private val cameraId: String) {
  private val characteristics = cameraManager.getCameraCharacteristics(cameraId)
  private val hardwareLevel = HardwareLevel.fromCameraCharacteristics(characteristics)
  private val capabilities = characteristics.get(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES) ?: IntArray(0)
  private val extensions = getSupportedExtensions()

  // device characteristics
  private val isMultiCam = capabilities.contains(11) // TODO: CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_LOGICAL_MULTI_CAMERA
  private val supportsDepthCapture = capabilities.contains(8) // TODO: CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_DEPTH_OUTPUT
  private val supportsRawCapture = capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_RAW)
  private val supportsLowLightBoost = extensions.contains(4) // TODO: CameraExtensionCharacteristics.EXTENSION_NIGHT
  private val lensFacing = LensFacing.fromCameraCharacteristics(characteristics)
  private val hasFlash = characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) ?: false
  private val focalLengths =
    characteristics.get(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS)
      // 35mm is the film standard sensor size
      ?: floatArrayOf(35f)
  private val sensorSize = characteristics.get(CameraCharacteristics.SENSOR_INFO_PHYSICAL_SIZE)!!
  private val sensorOrientation = characteristics.get(CameraCharacteristics.SENSOR_ORIENTATION)!!
  private val name = (
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      characteristics.get(CameraCharacteristics.INFO_VERSION)
    } else {
      null
    }
    ) ?: "$lensFacing ($cameraId)"

  // "formats" (all possible configurations for this device)
  private val zoomRange = (
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      characteristics.get(CameraCharacteristics.CONTROL_ZOOM_RATIO_RANGE)
    } else {
      null
    }
    ) ?: Range(1f, characteristics.get(CameraCharacteristics.SCALER_AVAILABLE_MAX_DIGITAL_ZOOM) ?: 1f)
  private val minZoom = zoomRange.lower.toDouble()
  private val maxZoom = zoomRange.upper.toDouble()

  private val cameraConfig = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
  private val isoRange = characteristics.get(CameraCharacteristics.SENSOR_INFO_SENSITIVITY_RANGE) ?: Range(0, 0)
  private val digitalStabilizationModes =
    characteristics.get(CameraCharacteristics.CONTROL_AVAILABLE_VIDEO_STABILIZATION_MODES) ?: IntArray(0)
  private val opticalStabilizationModes =
    characteristics.get(CameraCharacteristics.LENS_INFO_AVAILABLE_OPTICAL_STABILIZATION) ?: IntArray(0)
  private val supportsPhotoHdr = extensions.contains(3) // TODO: CameraExtensionCharacteristics.EXTENSION_HDR
  private val supportsVideoHdr = getHasVideoHdr()

  private val videoFormat = ImageFormat.YUV_420_888

  // get extensions (HDR, Night Mode, ..)
  private fun getSupportedExtensions(): List<Int> =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val extensions = cameraManager.getCameraExtensionCharacteristics(cameraId)
      extensions.supportedExtensions
    } else {
      emptyList()
    }

  private fun getHasVideoHdr(): Boolean {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      if (capabilities.contains(CameraMetadata.REQUEST_AVAILABLE_CAPABILITIES_DYNAMIC_RANGE_TEN_BIT)) {
        val availableProfiles = characteristics.get(CameraCharacteristics.REQUEST_AVAILABLE_DYNAMIC_RANGE_PROFILES)
          ?: DynamicRangeProfiles(LongArray(0))
        return availableProfiles.supportedProfiles.contains(DynamicRangeProfiles.HLG10) ||
          availableProfiles.supportedProfiles.contains(DynamicRangeProfiles.HDR10)
      }
    }
    return false
  }

  private fun createStabilizationModes(): ReadableArray {
    val array = Arguments.createArray()
    digitalStabilizationModes.forEach { videoStabilizationMode ->
      val mode = VideoStabilizationMode.fromDigitalVideoStabilizationMode(videoStabilizationMode)
      array.pushString(mode.unionValue)
    }
    opticalStabilizationModes.forEach { videoStabilizationMode ->
      val mode = VideoStabilizationMode.fromOpticalVideoStabilizationMode(videoStabilizationMode)
      array.pushString(mode.unionValue)
    }
    return array
  }

  // 35mm is 135 film format, a standard in which focal lengths are usually measured
  private val size35mm = Size(36, 24)

  private fun getDeviceTypes(): ReadableArray {
    // To get valid focal length standards we have to upscale to the 35mm measurement (film standard)
    val cropFactor = size35mm.bigger / sensorSize.bigger

    val deviceTypes = Arguments.createArray()

    focalLengths.forEach { focalLength ->
      // scale to the 35mm film standard
      val l = focalLength * cropFactor
      when {
        // https://en.wikipedia.org/wiki/Ultra_wide_angle_lens
        l < 24f -> deviceTypes.pushString("ultra-wide-angle-camera")
        // https://en.wikipedia.org/wiki/Wide-angle_lens
        l in 24f..43f -> deviceTypes.pushString("wide-angle-camera")
        // https://en.wikipedia.org/wiki/Telephoto_lens
        l > 43f -> deviceTypes.pushString("telephoto-camera")
        else -> throw Error("Invalid focal length! (${focalLength}mm)")
      }
    }

    return deviceTypes
  }

  private fun getFieldOfView(): Double = 2 * atan(sensorSize.bigger / (focalLengths[0] * 2)) * (180 / PI)

  private fun getVideoSizes(): List<Size> = characteristics.getVideoSizes(cameraId, videoFormat)
  private fun getPhotoSizes(): List<Size> = characteristics.getPhotoSizes(ImageFormat.JPEG)

  private fun getFormats(): ReadableArray {
    val array = Arguments.createArray()

    val videoSizes = getVideoSizes()
    val photoSizes = getPhotoSizes()

    videoSizes.forEach { videoSize ->
      val frameDuration = cameraConfig.getOutputMinFrameDuration(videoFormat, videoSize)
      val maxFps = (1.0 / (frameDuration.toDouble() / 1_000_000_000)).toInt()

      photoSizes.forEach { photoSize ->
        val map = buildFormatMap(photoSize, videoSize, Range(1, maxFps))
        array.pushMap(map)
      }
    }

    // TODO: Add high-speed video ranges (high-fps / slow-motion)

    return array
  }

  private fun createPixelFormats(size: Size): ReadableArray {
    val formats = cameraConfig.outputFormats
    val array = Arguments.createArray()
    formats.forEach { format ->
      val sizes = cameraConfig.getOutputSizes(format)
      val hasSize = sizes.any { it.width == size.width && it.height == size.height }
      if (hasSize) {
        array.pushString(PixelFormat.fromImageFormat(format).unionValue)
      }
    }
    return array
  }

  private fun buildFormatMap(photoSize: Size, videoSize: Size, fpsRange: Range<Int>): ReadableMap {
    val map = Arguments.createMap()
    map.putInt("photoHeight", photoSize.height)
    map.putInt("photoWidth", photoSize.width)
    map.putInt("videoHeight", videoSize.height)
    map.putInt("videoWidth", videoSize.width)
    map.putInt("minISO", isoRange.lower)
    map.putInt("maxISO", isoRange.upper)
    map.putInt("minFps", fpsRange.lower)
    map.putInt("maxFps", fpsRange.upper)
    map.putDouble("fieldOfView", getFieldOfView())
    map.putBoolean("supportsVideoHDR", supportsVideoHdr)
    map.putBoolean("supportsPhotoHDR", supportsPhotoHdr)
    map.putString("autoFocusSystem", "contrast-detection") // TODO: Is this wrong?
    map.putArray("videoStabilizationModes", createStabilizationModes())
    map.putArray("pixelFormats", createPixelFormats(videoSize))
    return map
  }

  fun toMap(): ReadableMap {
    val map = Arguments.createMap()
    map.putString("id", cameraId)
    map.putArray("devices", getDeviceTypes())
    map.putString("position", lensFacing.unionValue)
    map.putString("name", name)
    map.putBoolean("hasFlash", hasFlash)
    map.putBoolean("hasTorch", hasFlash)
    map.putBoolean("isMultiCam", isMultiCam)
    map.putBoolean("supportsRawCapture", supportsRawCapture)
    map.putBoolean("supportsDepthCapture", supportsDepthCapture)
    map.putBoolean("supportsLowLightBoost", supportsLowLightBoost)
    map.putBoolean("supportsFocus", true) // I believe every device here supports focussing
    map.putDouble("minZoom", minZoom)
    map.putDouble("maxZoom", maxZoom)
    map.putDouble("neutralZoom", 1.0) // Zoom is always relative to 1.0 on Android
    map.putString("hardwareLevel", hardwareLevel.unionValue)
    map.putString("sensorOrientation", Orientation.fromRotationDegrees(sensorOrientation).unionValue)
    map.putArray("formats", getFormats())
    return map
  }
}
