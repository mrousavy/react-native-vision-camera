package com.mrousavy.camera.parsers

import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.ImageReader
import android.media.MediaRecorder
import android.os.Build
import android.util.Log
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.extensions.HdrImageCaptureExtender
import androidx.camera.extensions.NightImageCaptureExtender
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.mrousavy.camera.CameraViewModule
import com.mrousavy.camera.utils.*

fun parseCameraDeviceId(id: String, manager: CameraManager): WritableMap? {
  val cameraSelector = CameraSelector.Builder().byID(id).build()
  // TODO: ImageCapture.Builder - I'm not setting the target resolution, does that matter?
  val imageCaptureBuilder = ImageCapture.Builder()

  val characteristics = manager.getCameraCharacteristics(id)
  val hardwareLevel = characteristics.get(CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL)!!

  // Filters out cameras that are LEGACY hardware level. Those don't support Preview + Photo Capture + Video Capture at the same time.
  if (hardwareLevel == CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY) {
    Log.i(
      CameraViewModule.REACT_CLASS,
      "Skipping Camera #$id because it does not meet the minimum requirements for react-native-vision-camera. " +
        "See the tables at https://developer.android.com/reference/android/hardware/camera2/CameraDevice#regular-capture for more information."
    )
    return null
  }

  val capabilities = characteristics.get(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES)!!
  val isMultiCam = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P &&
    capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_LOGICAL_MULTI_CAMERA)
  val deviceTypes = characteristics.getDeviceTypes()

  val cameraConfig = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
  val lensFacing = characteristics.get(CameraCharacteristics.LENS_FACING)!!
  val hasFlash = characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE)!!
  val maxScalerZoom = characteristics.get(CameraCharacteristics.SCALER_AVAILABLE_MAX_DIGITAL_ZOOM)!!
  val supportsDepthCapture = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
    capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_DEPTH_OUTPUT)
  val supportsRawCapture = capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_RAW)
  val isoRange = characteristics.get(CameraCharacteristics.SENSOR_INFO_SENSITIVITY_RANGE)
  val stabilizationModes = characteristics.get(CameraCharacteristics.CONTROL_AVAILABLE_VIDEO_STABILIZATION_MODES)!! // only digital, no optical
  val zoomRange = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
    characteristics.get(CameraCharacteristics.CONTROL_ZOOM_RATIO_RANGE)
  else null
  val name = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P)
    characteristics.get(CameraCharacteristics.INFO_VERSION)
  else null
  val fpsRanges = characteristics.get(CameraCharacteristics.CONTROL_AE_AVAILABLE_TARGET_FPS_RANGES)!!

  val hdrExtension = HdrImageCaptureExtender.create(imageCaptureBuilder)
  val supportsHdr = hdrExtension.isExtensionAvailable(cameraSelector)
  val nightExtension = NightImageCaptureExtender.create(imageCaptureBuilder)
  val supportsLowLightBoost = nightExtension.isExtensionAvailable(cameraSelector)

  val fieldOfView = characteristics.getFieldOfView()

  val map = Arguments.createMap()
  val formats = Arguments.createArray()
  map.putString("id", id)
  map.putArray("devices", deviceTypes)
  map.putString("position", parseLensFacing(lensFacing))
  map.putString("name", name ?: "${parseLensFacing(lensFacing)} ($id)")
  map.putBoolean("hasFlash", hasFlash)
  map.putBoolean("hasTorch", hasFlash)
  map.putBoolean("isMultiCam", isMultiCam)
  map.putBoolean("supportsRawCapture", supportsRawCapture)
  map.putBoolean("supportsDepthCapture", supportsDepthCapture)
  map.putBoolean("supportsLowLightBoost", supportsLowLightBoost)
  map.putBoolean("supportsFocus", true) // I believe every device here supports focussing
  if (zoomRange != null) {
    map.putDouble("minZoom", zoomRange.lower.toDouble())
    map.putDouble("maxZoom", zoomRange.upper.toDouble())
  } else {
    map.putDouble("minZoom", 1.0)
    map.putDouble("maxZoom", maxScalerZoom.toDouble())
  }
  map.putDouble("neutralZoom", characteristics.neutralZoomPercent.toDouble())

  val maxImageOutputSize = cameraConfig.getOutputSizes(ImageReader::class.java).maxByOrNull { it.width * it.height }!!

  // TODO: Should I really check MediaRecorder::class instead of SurfaceView::class?
  // Recording should always be done in the most efficient format, which is the format native to the camera framework
  cameraConfig.getOutputSizes(MediaRecorder::class.java).forEach { size ->
    val format = parseCameraDeviceFormatId(size, cameraConfig, maxImageOutputSize, fpsRanges)
    formats.pushMap(format)
  }

  map.putArray("formats", formats)
  return map
}
