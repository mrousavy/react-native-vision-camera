package com.mrousavy.camera.core

import android.graphics.ImageFormat
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CameraMetadata
import android.os.Build
import android.util.Range
import android.util.Size
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.extensions.getPhotoSizes
import com.mrousavy.camera.extensions.getVideoSizes
import com.mrousavy.camera.extensions.toJSValue
import com.mrousavy.camera.types.AutoFocusSystem
import com.mrousavy.camera.types.DeviceType
import com.mrousavy.camera.types.HardwareLevel
import com.mrousavy.camera.types.LensFacing
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.PixelFormat
import com.mrousavy.camera.types.VideoStabilizationMode
import kotlin.math.atan2
import kotlin.math.sqrt

class CameraDeviceDetails(val cameraManager: CameraManager, val cameraId: String) {
  val characteristics = cameraManager.getCameraCharacteristics(cameraId)
  val hardwareLevel = HardwareLevel.fromCameraCharacteristics(characteristics)
  val capabilities = characteristics.get(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES) ?: IntArray(0)
  val extensions = getSupportedExtensions()

  // device characteristics
  val isMultiCam = capabilities.contains(11) // TODO: CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_LOGICAL_MULTI_CAMERA
  val supportsDepthCapture = capabilities.contains(8) // TODO: CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_DEPTH_OUTPUT
  val supportsRawCapture = capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_RAW)
  val supportsLowLightBoost = extensions.contains(4) // TODO: CameraExtensionCharacteristics.EXTENSION_NIGHT
  val lensFacing = LensFacing.fromCameraCharacteristics(characteristics)
  val hasFlash = characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) ?: false
  val focalLengths =
    characteristics.get(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS)
      // 35mm is the film standard sensor size
      ?: floatArrayOf(35f)
  val sensorSize = characteristics.get(CameraCharacteristics.SENSOR_INFO_PHYSICAL_SIZE)!!
  val sensorOrientation = characteristics.get(CameraCharacteristics.SENSOR_ORIENTATION)!!
  val minFocusDistance = getMinFocusDistanceCm()
  val name = (
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      characteristics.get(CameraCharacteristics.INFO_VERSION)
    } else {
      null
    }
    ) ?: "$lensFacing ($cameraId)"

  // "formats" (all possible configurations for this device)
  val zoomRange = (
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      characteristics.get(CameraCharacteristics.CONTROL_ZOOM_RATIO_RANGE)
    } else {
      null
    }
    ) ?: Range(1f, characteristics.get(CameraCharacteristics.SCALER_AVAILABLE_MAX_DIGITAL_ZOOM) ?: 1f)
  val physicalDevices = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && characteristics.physicalCameraIds.isNotEmpty()) {
    characteristics.physicalCameraIds
  } else {
    setOf(cameraId)
  }
  val minZoom = zoomRange.lower.toDouble()
  val maxZoom = zoomRange.upper.toDouble()

  val cameraConfig = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
  val isoRange = characteristics.get(CameraCharacteristics.SENSOR_INFO_SENSITIVITY_RANGE) ?: Range(0, 0)
  val exposureRange = characteristics.get(CameraCharacteristics.CONTROL_AE_COMPENSATION_RANGE) ?: Range(0, 0)
  val digitalStabilizationModes =
    characteristics.get(CameraCharacteristics.CONTROL_AVAILABLE_VIDEO_STABILIZATION_MODES) ?: IntArray(0)
  val opticalStabilizationModes =
    characteristics.get(CameraCharacteristics.LENS_INFO_AVAILABLE_OPTICAL_STABILIZATION) ?: IntArray(0)
  val supportsPhotoHdr = extensions.contains(3) // TODO: CameraExtensionCharacteristics.EXTENSION_HDR
  val supportsVideoHdr = getHasVideoHdr()

  val videoFormat = ImageFormat.YUV_420_888

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
        val recommendedHdrProfile = characteristics.get(CameraCharacteristics.REQUEST_RECOMMENDED_TEN_BIT_DYNAMIC_RANGE_PROFILE)
        return recommendedHdrProfile != null
      }
    }
    return false
  }

  private fun getMinFocusDistanceCm(): Double {
    val distance = characteristics.get(CameraCharacteristics.LENS_INFO_MINIMUM_FOCUS_DISTANCE)
    if (distance == null || distance == 0f) return 0.0
    // distance is in "diopters", meaning 1/meter. Convert to meters, then centi-meters
    return 1.0 / distance * 100.0
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

  private fun getDeviceTypes(): List<DeviceType> {
    val deviceTypes = physicalDevices.map { id ->
      val details = CameraDeviceDetails(cameraManager, id)
      val fov = details.getMaxFieldOfView()
      return@map when {
        fov > 94 -> DeviceType.ULTRA_WIDE_ANGLE
        fov in 60f..94f -> DeviceType.WIDE_ANGLE
        fov < 60f -> DeviceType.TELEPHOTO
        else -> throw Error("Invalid Field Of View! ($fov)")
      }
    }
    return deviceTypes
  }

  private fun getFieldOfView(focalLength: Float): Double {
    val sensorDiagonal = sqrt((sensorSize.width * sensorSize.width + sensorSize.height * sensorSize.height).toDouble())
    val fovRadians = 2.0 * atan2(sensorDiagonal, (2.0 * focalLength))
    return Math.toDegrees(fovRadians)
  }

  private fun getMaxFieldOfView(): Double {
    val smallestFocalLength = focalLengths.minOrNull() ?: return 0.0
    return getFieldOfView(smallestFocalLength)
  }

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

  private fun createPixelFormats(): ReadableArray {
    // Every output in Camera2 supports YUV and NATIVE
    val array = Arguments.createArray()
    array.pushString(PixelFormat.YUV.unionValue)
    array.pushString(PixelFormat.NATIVE.unionValue)
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
    map.putDouble("maxZoom", maxZoom)
    map.putDouble("fieldOfView", getMaxFieldOfView())
    map.putBoolean("supportsVideoHdr", supportsVideoHdr)
    map.putBoolean("supportsPhotoHdr", supportsPhotoHdr)
    map.putBoolean("supportsDepthCapture", supportsDepthCapture)
    map.putString("autoFocusSystem", AutoFocusSystem.CONTRAST_DETECTION.unionValue)
    map.putArray("videoStabilizationModes", createStabilizationModes())
    map.putArray("pixelFormats", createPixelFormats())
    return map
  }

  fun toMap(): ReadableMap {
    val deviceTypes = getDeviceTypes()

    val map = Arguments.createMap()
    map.putString("id", cameraId)
    map.putArray("physicalDevices", deviceTypes.toJSValue())
    map.putString("position", lensFacing.unionValue)
    map.putString("name", name)
    map.putBoolean("hasFlash", hasFlash)
    map.putBoolean("hasTorch", hasFlash)
    map.putDouble("minFocusDistance", minFocusDistance)
    map.putBoolean("isMultiCam", isMultiCam)
    map.putBoolean("supportsRawCapture", supportsRawCapture)
    map.putBoolean("supportsLowLightBoost", supportsLowLightBoost)
    map.putBoolean("supportsFocus", true) // I believe every device here supports focussing
    map.putDouble("minZoom", minZoom)
    map.putDouble("maxZoom", maxZoom)
    map.putDouble("neutralZoom", 1.0) // Zoom is always relative to 1.0 on Android
    map.putDouble("minExposure", exposureRange.lower.toDouble())
    map.putDouble("maxExposure", exposureRange.upper.toDouble())
    map.putString("hardwareLevel", hardwareLevel.unionValue)
    map.putString("sensorOrientation", Orientation.fromRotationDegrees(sensorOrientation).unionValue)
    map.putArray("formats", getFormats())
    return map
  }
}
