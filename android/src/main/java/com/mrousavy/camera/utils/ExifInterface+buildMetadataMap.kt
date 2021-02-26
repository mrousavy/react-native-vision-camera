package com.mrousavy.camera.utils

import androidx.exifinterface.media.ExifInterface
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

fun ExifInterface.buildMetadataMap(): WritableMap {
  val metadataMap = Arguments.createMap()
  metadataMap.putInt("Orientation", this.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL))

  val tiffMap = Arguments.createMap()
  tiffMap.putInt("ResolutionUnit", this.getAttributeInt(ExifInterface.TAG_RESOLUTION_UNIT, 0))
  tiffMap.putString("Software", this.getAttribute(ExifInterface.TAG_SOFTWARE))
  tiffMap.putString("Make", this.getAttribute(ExifInterface.TAG_MAKE))
  tiffMap.putString("DateTime", this.getAttribute(ExifInterface.TAG_DATETIME))
  tiffMap.putDouble("XResolution", this.getAttributeDouble(ExifInterface.TAG_X_RESOLUTION, 0.0))
  tiffMap.putString("Model", this.getAttribute(ExifInterface.TAG_MODEL))
  tiffMap.putDouble("YResolution", this.getAttributeDouble(ExifInterface.TAG_Y_RESOLUTION, 0.0))
  metadataMap.putMap("{TIFF}", tiffMap)

  val exifMap = Arguments.createMap()
  exifMap.putString("DateTimeOriginal", this.getAttribute(ExifInterface.TAG_DATETIME_ORIGINAL))
  exifMap.putDouble("ExposureTime", this.getAttributeDouble(ExifInterface.TAG_EXPOSURE_TIME, 0.0))
  exifMap.putDouble("FNumber", this.getAttributeDouble(ExifInterface.TAG_F_NUMBER, 0.0))
  val lensSpecificationArray = Arguments.createArray()
  this.getAttributeRange(ExifInterface.TAG_LENS_SPECIFICATION)?.forEach { lensSpecificationArray.pushInt(it.toInt()) }
  exifMap.putArray("LensSpecification", lensSpecificationArray)
  exifMap.putDouble("ExposureBiasValue", this.getAttributeDouble(ExifInterface.TAG_EXPOSURE_BIAS_VALUE, 0.0))
  exifMap.putInt("ColorSpace", this.getAttributeInt(ExifInterface.TAG_COLOR_SPACE, ExifInterface.COLOR_SPACE_S_RGB))
  exifMap.putInt("FocalLenIn35mmFilm", this.getAttributeInt(ExifInterface.TAG_FOCAL_LENGTH_IN_35MM_FILM, 0))
  exifMap.putDouble("BrightnessValue", this.getAttributeDouble(ExifInterface.TAG_BRIGHTNESS_VALUE, 0.0))
  exifMap.putInt("ExposureMode", this.getAttributeInt(ExifInterface.TAG_EXPOSURE_MODE, ExifInterface.EXPOSURE_MODE_AUTO.toInt()))
  exifMap.putString("LensModel", this.getAttribute(ExifInterface.TAG_LENS_MODEL))
  exifMap.putInt("SceneType", this.getAttributeInt(ExifInterface.TAG_SCENE_TYPE, ExifInterface.SCENE_TYPE_DIRECTLY_PHOTOGRAPHED.toInt()))
  exifMap.putInt("PixelXDimension", this.getAttributeInt(ExifInterface.TAG_PIXEL_X_DIMENSION, 0))
  exifMap.putDouble("ShutterSpeedValue", this.getAttributeDouble(ExifInterface.TAG_SHUTTER_SPEED_VALUE, 0.0))
  exifMap.putInt("SensingMethod", this.getAttributeInt(ExifInterface.TAG_SENSING_METHOD, ExifInterface.SENSOR_TYPE_NOT_DEFINED.toInt()))
  val subjectAreaArray = Arguments.createArray()
  this.getAttributeRange(ExifInterface.TAG_SUBJECT_AREA)?.forEach { subjectAreaArray.pushInt(it.toInt()) }
  exifMap.putArray("SubjectArea", subjectAreaArray)
  exifMap.putDouble("ApertureValue", this.getAttributeDouble(ExifInterface.TAG_APERTURE_VALUE, 0.0))
  exifMap.putString("SubsecTimeDigitized", this.getAttribute(ExifInterface.TAG_SUBSEC_TIME_DIGITIZED))
  exifMap.putDouble("FocalLength", this.getAttributeDouble(ExifInterface.TAG_FOCAL_LENGTH, 0.0))
  exifMap.putString("LensMake", this.getAttribute(ExifInterface.TAG_LENS_MAKE))
  exifMap.putString("SubsecTimeOriginal", this.getAttribute(ExifInterface.TAG_SUBSEC_TIME_ORIGINAL))
  exifMap.putString("OffsetTimeDigitized", this.getAttribute(ExifInterface.TAG_OFFSET_TIME_DIGITIZED))
  exifMap.putInt("PixelYDimension", this.getAttributeInt(ExifInterface.TAG_PIXEL_Y_DIMENSION, 0))
  val isoSpeedRatingsArray = Arguments.createArray()
  this.getAttributeRange(ExifInterface.TAG_PHOTOGRAPHIC_SENSITIVITY)?.forEach { isoSpeedRatingsArray.pushInt(it.toInt()) }
  exifMap.putArray("ISOSpeedRatings", isoSpeedRatingsArray)
  exifMap.putInt("WhiteBalance", this.getAttributeInt(ExifInterface.TAG_WHITE_BALANCE, 0))
  exifMap.putString("DateTimeDigitized", this.getAttribute(ExifInterface.TAG_DATETIME_DIGITIZED))
  exifMap.putString("OffsetTimeOriginal", this.getAttribute(ExifInterface.TAG_OFFSET_TIME_ORIGINAL))
  exifMap.putString("ExifVersion", this.getAttribute(ExifInterface.TAG_EXIF_VERSION))
  exifMap.putString("OffsetTime", this.getAttribute(ExifInterface.TAG_OFFSET_TIME))
  exifMap.putInt("Flash", this.getAttributeInt(ExifInterface.TAG_FLASH, ExifInterface.FLAG_FLASH_FIRED.toInt()))
  exifMap.putInt("ExposureProgram", this.getAttributeInt(ExifInterface.TAG_EXPOSURE_PROGRAM, ExifInterface.EXPOSURE_PROGRAM_NOT_DEFINED.toInt()))
  exifMap.putInt("MeteringMode", this.getAttributeInt(ExifInterface.TAG_METERING_MODE, ExifInterface.METERING_MODE_UNKNOWN.toInt()))
  metadataMap.putMap("{Exif}", exifMap)

  return metadataMap
}
