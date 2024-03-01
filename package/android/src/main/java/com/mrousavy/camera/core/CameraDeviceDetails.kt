package com.mrousavy.camera.core

import android.annotation.SuppressLint
import android.content.res.Resources
import android.graphics.ImageFormat
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraExtensionCharacteristics
import android.hardware.camera2.CameraMetadata
import android.os.Build
import android.util.Log
import android.util.Range
import android.util.Rational
import android.util.Size
import android.util.SizeF
import android.view.SurfaceHolder
import androidx.camera.camera2.internal.Camera2CameraInfoImpl
import androidx.camera.camera2.interop.Camera2CameraInfo
import androidx.camera.core.CameraInfo
import androidx.camera.core.FocusMeteringAction
import androidx.camera.core.ImageCapture
import androidx.camera.core.MeteringPoint
import androidx.camera.core.MeteringPointFactory
import androidx.camera.core.impl.CameraInfoInternal
import androidx.camera.core.impl.capability.PreviewCapabilitiesImpl
import androidx.camera.video.Recorder
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.extensions.bigger
import com.mrousavy.camera.extensions.getPhotoSizes
import com.mrousavy.camera.extensions.getVideoSizes
import com.mrousavy.camera.extensions.id
import com.mrousavy.camera.extensions.smaller
import com.mrousavy.camera.extensions.toJSValue
import com.mrousavy.camera.types.AutoFocusSystem
import com.mrousavy.camera.types.DeviceType
import com.mrousavy.camera.types.HardwareLevel
import com.mrousavy.camera.types.Position
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.PixelFormat
import com.mrousavy.camera.types.VideoStabilizationMode
import com.mrousavy.camera.utils.CamcorderProfileUtils
import kotlin.math.atan2
import kotlin.math.sqrt

@SuppressLint("RestrictedApi")
class CameraDeviceDetails(val cameraInfo: CameraInfo) {
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

  // Generic props available on all implementations
  private val cameraId = cameraInfo.id ?: throw NoCameraDeviceError()
  private val position = Position.fromLensFacing(cameraInfo.lensFacing)
  private val name = "${cameraInfo.implementationType} (${cameraId})"
  private val hasFlash = cameraInfo.hasFlashUnit()
  private val minZoom = cameraInfo.zoomState.value?.minZoomRatio ?: 0f
  private val maxZoom = cameraInfo.zoomState.value?.maxZoomRatio ?: 1f
  // TODO: Do I need to multiply by step, or no?
  private val exposureStep = cameraInfo.exposureState.exposureCompensationStep.toDouble()
  private val minExposure = cameraInfo.exposureState.exposureCompensationRange.lower * exposureStep
  private val maxExposure = cameraInfo.exposureState.exposureCompensationRange.upper * exposureStep
  private val supportsFocus = cameraInfo.isFocusMeteringSupported()

  val previewCapabilities = PreviewCapabilitiesImpl.from(cameraInfo)
  val photoCapabilities = ImageCapture.getImageCaptureCapabilities(cameraInfo)
  val videoCapabilities = Recorder.getVideoCapabilities(cameraInfo)

  // Camera2 specific props
  private val camera2Details = cameraInfo as? Camera2CameraInfoImpl
  private val physicalDeviceIds = camera2Details?.cameraCharacteristicsMap?.keys ?: emptySet()
  private val isMultiCam = physicalDeviceIds.size > 1
  private val sensorRotationDegrees = camera2Details?.sensorRotationDegrees ?: 0
  private val sensorOrientation = Orientation.fromRotationDegrees(sensorRotationDegrees)
  private val cameraHardwareLevel = camera2Details?.cameraCharacteristicsCompat?.get(CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL)
  private val hardwareLevel = HardwareLevel.fromCameraHardwareLevel(cameraHardwareLevel ?: CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY)

  fun toMap(): ReadableMap {
    val deviceTypes = getDeviceTypes()

    (cameraInfo as CameraInfoInternal).getPhysicalCameraCharacteristics()

    val map = Arguments.createMap()
    map.putString("id", cameraId)
    map.putArray("physicalDevices", deviceTypes.toJSValue())
    map.putString("position",  position.unionValue)
    map.putString("name", name)
    map.putBoolean("hasFlash", hasFlash)
    map.putBoolean("hasTorch", hasFlash)
    map.putDouble("minFocusDistance", minFocusDistance)
    map.putBoolean("isMultiCam", isMultiCam)
    map.putBoolean("supportsRawCapture", supportsRawCapture)
    map.putBoolean("supportsLowLightBoost", supportsLowLightBoost)
    map.putBoolean("supportsFocus", supportsFocusRegions)
    map.putDouble("minZoom", minZoom.toDouble())
    map.putDouble("maxZoom", maxZoom.toDouble())
    map.putDouble("neutralZoom", 1.0) // Zoom is always relative to 1.0 on Android
    map.putDouble("minExposure", minExposure)
    map.putDouble("maxExposure", maxExposure)
    map.putString("hardwareLevel", hardwareLevel.unionValue)
    map.putString("sensorOrientation", sensorOrientation.unionValue)
    map.putArray("formats", getFormats())
    return map
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
}
