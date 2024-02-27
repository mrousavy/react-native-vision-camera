package com.mrousavy.camera.core

import android.content.res.Resources
import android.graphics.ImageFormat
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraExtensionCharacteristics
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CameraMetadata
import android.os.Build
import android.util.Log
import android.util.Range
import android.util.Size
import android.util.SizeF
import android.view.SurfaceHolder
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.extensions.bigger
import com.mrousavy.camera.extensions.getPhotoSizes
import com.mrousavy.camera.extensions.getVideoSizes
import com.mrousavy.camera.extensions.smaller
import com.mrousavy.camera.extensions.toJSValue
import com.mrousavy.camera.types.AutoFocusSystem
import com.mrousavy.camera.types.DeviceType
import com.mrousavy.camera.types.HardwareLevel
import com.mrousavy.camera.types.LensFacing
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.PixelFormat
import com.mrousavy.camera.types.VideoStabilizationMode
import com.mrousavy.camera.utils.CamcorderProfileUtils
import kotlin.math.atan2
import kotlin.math.sqrt

class CameraDeviceDetails(private val cameraManager: CameraManager, val cameraId: String) {
  companion object {
    private const val TAG = "CameraDeviceDetails"

    fun getMaximumPreviewSize(): Size {
      // See https://developer.android.com/reference/android/hardware/camera2/params/StreamConfigurationMap
      // According to the Android Developer documentation, PREVIEW streams can have a resolution
      // of up to the phone's display's resolution, with a maximum of 1920x1080.
      val display1080p = Size(1920, 1080)
      val displaySize = Size(
        Resources.getSystem().displayMetrics.widthPixels,
        Resources.getSystem().displayMetrics.heightPixels
      )
      val isHighResScreen = displaySize.bigger >= display1080p.bigger || displaySize.smaller >= display1080p.smaller

      return if (isHighResScreen) display1080p else displaySize
    }
  }

  val characteristics by lazy { cameraManager.getCameraCharacteristics(cameraId) }
  val hardwareLevel by lazy { HardwareLevel.fromCameraCharacteristics(characteristics) }
  val capabilities by lazy { characteristics.get(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES) ?: IntArray(0) }
  val extensions by lazy { getSupportedExtensions() }

  // device characteristics
  val isMultiCam by lazy { capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_LOGICAL_MULTI_CAMERA) }
  val supportsDepthCapture by lazy { capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_DEPTH_OUTPUT) }
  val supportsRawCapture by lazy { capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_RAW) }
  val supportsLowLightBoost by lazy {
    extensions.contains(CameraExtensionCharacteristics.EXTENSION_NIGHT) &&
      modes.contains(CameraCharacteristics.CONTROL_MODE_USE_SCENE_MODE)
  }
  val lensFacing by lazy { LensFacing.fromCameraCharacteristics(characteristics) }
  val hasFlash by lazy { characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) ?: false }
  val focalLengths by lazy {
    // 35mm is the film standard sensor size
    characteristics.get(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS) ?: floatArrayOf(35f)
  }
  val sensorSize by lazy { characteristics.get(CameraCharacteristics.SENSOR_INFO_PHYSICAL_SIZE) ?: SizeF(0f, 0f) }
  val activeSize
    get() = characteristics.get(CameraCharacteristics.SENSOR_INFO_ACTIVE_ARRAY_SIZE)!!
  val sensorOrientation by lazy {
    val degrees = characteristics.get(CameraCharacteristics.SENSOR_ORIENTATION) ?: 0
    return@lazy Orientation.fromRotationDegrees(degrees)
  }
  val minFocusDistance by lazy { getMinFocusDistanceCm() }
  val name by lazy {
    val info = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) characteristics.get(CameraCharacteristics.INFO_VERSION) else null
    return@lazy info ?: "$lensFacing ($cameraId)"
  }

  // "formats" (all possible configurations for this device)
  val maxDigitalZoom by lazy { characteristics.get(CameraCharacteristics.SCALER_AVAILABLE_MAX_DIGITAL_ZOOM) ?: 1f }
  val zoomRange by lazy {
    val range = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      characteristics.get(CameraCharacteristics.CONTROL_ZOOM_RATIO_RANGE)
    } else {
      null
    }
    return@lazy range ?: Range(1f, maxDigitalZoom)
  }
  val physicalDevices by lazy {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && characteristics.physicalCameraIds.isNotEmpty()) {
      characteristics.physicalCameraIds
    } else {
      setOf(cameraId)
    }
  }
  val minZoom by lazy { zoomRange.lower.toDouble() }
  val maxZoom by lazy { zoomRange.upper.toDouble() }

  val cameraConfig by lazy { characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!! }
  val isoRange by lazy { characteristics.get(CameraCharacteristics.SENSOR_INFO_SENSITIVITY_RANGE) ?: Range(0, 0) }
  val exposureRange by lazy { characteristics.get(CameraCharacteristics.CONTROL_AE_COMPENSATION_RANGE) ?: Range(0, 0) }
  val digitalStabilizationModes by lazy {
    characteristics.get(CameraCharacteristics.CONTROL_AVAILABLE_VIDEO_STABILIZATION_MODES) ?: IntArray(0)
  }
  val opticalStabilizationModes by lazy {
    characteristics.get(CameraCharacteristics.LENS_INFO_AVAILABLE_OPTICAL_STABILIZATION) ?: IntArray(0)
  }
  val supportsPhotoHdr by lazy { extensions.contains(CameraExtensionCharacteristics.EXTENSION_HDR) }
  val supportsVideoHdr by lazy { getHasVideoHdr() }
  val autoFocusSystem by lazy { getAutoFocusSystemMode() }

  val supportsYuvProcessing by lazy { capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_YUV_REPROCESSING) }
  val supportsPrivateProcessing by lazy { capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_PRIVATE_REPROCESSING) }
  val supportsZsl by lazy { supportsYuvProcessing || supportsPrivateProcessing }

  val isBackwardsCompatible by lazy { capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_BACKWARD_COMPATIBLE) }
  val supportsSnapshotCapture by lazy { supportsSnapshotCapture() }

  val supportsFocusRegions by lazy { (characteristics.get(CameraCharacteristics.CONTROL_MAX_REGIONS_AF) ?: 0) > 0 }
  val supportsExposureRegions by lazy { (characteristics.get(CameraCharacteristics.CONTROL_MAX_REGIONS_AE) ?: 0) > 0 }
  val supportsWhiteBalanceRegions by lazy { (characteristics.get(CameraCharacteristics.CONTROL_MAX_REGIONS_AWB) ?: 0) > 0 }

  val modes by lazy { characteristics.get(CameraCharacteristics.CONTROL_AVAILABLE_MODES)?.toList() ?: emptyList() }
  val afModes by lazy { characteristics.get(CameraCharacteristics.CONTROL_AF_AVAILABLE_MODES)?.toList() ?: emptyList() }
  val aeModes by lazy { characteristics.get(CameraCharacteristics.CONTROL_AE_AVAILABLE_MODES)?.toList() ?: emptyList() }
  val awbModes by lazy { characteristics.get(CameraCharacteristics.CONTROL_AWB_AVAILABLE_MODES)?.toList() ?: emptyList() }

  val availableAberrationModes by lazy {
    characteristics.get(CameraCharacteristics.COLOR_CORRECTION_AVAILABLE_ABERRATION_MODES)
      ?: intArrayOf()
  }
  val availableHotPixelModes by lazy { characteristics.get(CameraCharacteristics.HOT_PIXEL_AVAILABLE_HOT_PIXEL_MODES) ?: intArrayOf() }
  val availableEdgeModes by lazy { characteristics.get(CameraCharacteristics.EDGE_AVAILABLE_EDGE_MODES) ?: intArrayOf() }
  val availableDistortionCorrectionModes by lazy { getAvailableDistortionCorrectionModesOrEmptyArray() }
  val availableShadingModes by lazy { characteristics.get(CameraCharacteristics.SHADING_AVAILABLE_MODES) ?: intArrayOf() }
  val availableToneMapModes by lazy { characteristics.get(CameraCharacteristics.TONEMAP_AVAILABLE_TONE_MAP_MODES) ?: intArrayOf() }
  val availableNoiseReductionModes by lazy {
    characteristics.get(CameraCharacteristics.NOISE_REDUCTION_AVAILABLE_NOISE_REDUCTION_MODES)
      ?: intArrayOf()
  }

  // TODO: Also add 10-bit YUV here?
  val videoFormat = ImageFormat.YUV_420_888
  val photoFormat = ImageFormat.JPEG

  // get extensions (HDR, Night Mode, ..)
  private fun getSupportedExtensions(): List<Int> =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val extensions = cameraManager.getCameraExtensionCharacteristics(cameraId)
      extensions.supportedExtensions
    } else {
      emptyList()
    }

  private fun getAvailableDistortionCorrectionModesOrEmptyArray(): IntArray =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      characteristics.get(CameraCharacteristics.DISTORTION_CORRECTION_AVAILABLE_MODES) ?: intArrayOf()
    } else {
      intArrayOf()
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
    if (distance.isNaN() || distance.isInfinite()) return 0.0
    // distance is in "diopters", meaning 1/meter. Convert to meters, then centi-meters
    return 1.0 / distance * 100.0
  }

  @Suppress("RedundantIf")
  private fun supportsSnapshotCapture(): Boolean {
    // As per CameraDevice.TEMPLATE_VIDEO_SNAPSHOT in documentation:
    if (hardwareLevel == HardwareLevel.LEGACY) return false
    if (supportsDepthCapture && !isBackwardsCompatible) return false
    return true
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

  private fun getAutoFocusSystemMode(): AutoFocusSystem {
    val supportedAFModes = characteristics.get(CameraCharacteristics.CONTROL_AF_AVAILABLE_MODES)
    val supportsAF = supportedAFModes?.contains(CameraCharacteristics.CONTROL_AF_MODE_AUTO) == true
    if (!supportsAF) return AutoFocusSystem.NONE

    val focusCalibrationSystem = characteristics.get(CameraCharacteristics.LENS_INFO_FOCUS_DISTANCE_CALIBRATION)
    return when (focusCalibrationSystem) {
      CameraCharacteristics.LENS_INFO_FOCUS_DISTANCE_CALIBRATION_CALIBRATED -> AutoFocusSystem.PHASE_DETECTION
      else -> AutoFocusSystem.CONTRAST_DETECTION
    }
  }

  private fun getFieldOfView(focalLength: Float): Double {
    if ((sensorSize.width == 0f) || (sensorSize.height == 0f)) {
      return 0.0
    }
    val sensorDiagonal = sqrt((sensorSize.width * sensorSize.width + sensorSize.height * sensorSize.height).toDouble())
    val fovRadians = 2.0 * atan2(sensorDiagonal, (2.0 * focalLength))
    return Math.toDegrees(fovRadians)
  }

  private fun getMaxFieldOfView(): Double {
    val smallestFocalLength = focalLengths.minOrNull() ?: return 0.0
    return getFieldOfView(smallestFocalLength)
  }

  fun getVideoSizes(format: Int): List<Size> = characteristics.getVideoSizes(cameraId, format)
  fun getPhotoSizes(): List<Size> = characteristics.getPhotoSizes(photoFormat)
  fun getPreviewSizes(): List<Size> {
    val maximumPreviewSize = getMaximumPreviewSize()
    return cameraConfig.getOutputSizes(SurfaceHolder::class.java)
      .filter { it.bigger <= maximumPreviewSize.bigger && it.smaller <= maximumPreviewSize.smaller }
  }

  private fun getFormats(): ReadableArray {
    val array = Arguments.createArray()

    val videoSizes = getVideoSizes(videoFormat)
    val photoSizes = getPhotoSizes()

    videoSizes.forEach { videoSize ->
      val frameDuration = cameraConfig.getOutputMinFrameDuration(videoFormat, videoSize)
      var maxFps = (1.0 / (frameDuration.toDouble() / 1_000_000_000)).toInt()
      val maxEncoderFps = CamcorderProfileUtils.getMaximumFps(cameraId, videoSize)
      if (maxEncoderFps != null && maxEncoderFps < maxFps) {
        Log.i(
          TAG,
          "Camera could do $maxFps FPS at $videoSize, but Media Encoder can only do $maxEncoderFps FPS. Clamping to $maxEncoderFps FPS..."
        )
        maxFps = maxEncoderFps
      }

      photoSizes.forEach { photoSize ->
        val map = buildFormatMap(photoSize, videoSize, Range(1, maxFps))
        array.pushMap(map)
      }
    }

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
    map.putString("autoFocusSystem", autoFocusSystem.unionValue)
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
    map.putBoolean("supportsFocus", supportsFocusRegions)
    map.putDouble("minZoom", minZoom)
    map.putDouble("maxZoom", maxZoom)
    map.putDouble("neutralZoom", 1.0) // Zoom is always relative to 1.0 on Android
    map.putDouble("minExposure", exposureRange.lower.toDouble())
    map.putDouble("maxExposure", exposureRange.upper.toDouble())
    map.putString("hardwareLevel", hardwareLevel.unionValue)
    map.putString("sensorOrientation", sensorOrientation.unionValue)
    map.putArray("formats", getFormats())
    return map
  }
}
