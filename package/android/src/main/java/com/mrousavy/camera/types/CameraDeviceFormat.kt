package com.mrousavy.camera.types

import android.util.Size
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.core.InvalidTypeScriptUnionError

data class CameraDeviceFormat(
  val videoWidth: Int,
  val videoHeight: Int,
  val photoWidth: Int,
  val photoHeight: Int,
  val minFps: Double,
  val maxFps: Double,
  val minISO: Double,
  val maxISO: Double,
  val fieldOfView: Double,
  val maxZoom: Double,
  val videoStabilizationModes: Array<VideoStabilizationMode>,
  val autoFocusSystem: AutoFocusSystem,
  val supportsVideoHDR: Boolean,
  val supportsPhotoHDR: Boolean,
  val pixelFormats: Array<PixelFormat>,
  val supportsDepthCapture: Boolean
) {
  val photoSize: Size
    get() = Size(photoWidth, photoHeight)
  val videoSize: Size
    get() = Size(videoWidth, videoHeight)

  companion object {
    fun fromJSValue(value: ReadableMap): CameraDeviceFormat {
      val modes = value.getArray("videoStabilizationModes") ?: throw InvalidTypeScriptUnionError("format", value.toString())
      val videoStabilizationModes = modes.toArrayList().map { VideoStabilizationMode.fromUnionValue(it as String) }

      val formats = value.getArray("pixelFormats") ?: throw InvalidTypeScriptUnionError("format", value.toString())
      val pixelFormats = formats.toArrayList().map { PixelFormat.fromUnionValue(it as String) }

      val autoFocusSystem = AutoFocusSystem.fromUnionValue(value.getString("autoFocusSystem"))

      return CameraDeviceFormat(
        value.getInt("videoWidth"),
        value.getInt("videoHeight"),
        value.getInt("photoWidth"),
        value.getInt("photoHeight"),
        value.getDouble("minFps"),
        value.getDouble("maxFps"),
        value.getDouble("minISO"),
        value.getDouble("maxISO"),
        value.getDouble("fieldOfView"),
        value.getDouble("maxZoom"),
        videoStabilizationModes.toTypedArray(),
        autoFocusSystem,
        value.getBoolean("supportsVideoHDR"),
        value.getBoolean("supportsPhotoHDR"),
        pixelFormats.toTypedArray(),
        value.getBoolean("supportsDepthCapture")
      )
    }
  }

  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (javaClass != other?.javaClass) return false

    other as CameraDeviceFormat

    if (videoWidth != other.videoWidth) return false
    if (videoHeight != other.videoHeight) return false
    if (photoWidth != other.photoWidth) return false
    if (photoHeight != other.photoHeight) return false
    if (minFps != other.minFps) return false
    if (maxFps != other.maxFps) return false
    if (minISO != other.minISO) return false
    if (maxISO != other.maxISO) return false
    if (fieldOfView != other.fieldOfView) return false
    if (maxZoom != other.maxZoom) return false
    if (!videoStabilizationModes.contentEquals(other.videoStabilizationModes)) return false
    if (autoFocusSystem != other.autoFocusSystem) return false
    if (supportsVideoHDR != other.supportsVideoHDR) return false
    if (supportsPhotoHDR != other.supportsPhotoHDR) return false
    if (!pixelFormats.contentEquals(other.pixelFormats)) return false
    if (supportsDepthCapture != other.supportsDepthCapture) return false

    return true
  }

  override fun hashCode(): Int {
    var result = videoWidth
    result = 31 * result + videoHeight
    result = 31 * result + photoWidth
    result = 31 * result + photoHeight
    result = 31 * result + minFps.hashCode()
    result = 31 * result + maxFps.hashCode()
    result = 31 * result + minISO.hashCode()
    result = 31 * result + maxISO.hashCode()
    result = 31 * result + fieldOfView.hashCode()
    result = 31 * result + maxZoom.hashCode()
    result = 31 * result + videoStabilizationModes.contentHashCode()
    result = 31 * result + autoFocusSystem.hashCode()
    result = 31 * result + supportsVideoHDR.hashCode()
    result = 31 * result + supportsPhotoHDR.hashCode()
    result = 31 * result + pixelFormats.contentHashCode()
    result = 31 * result + supportsDepthCapture.hashCode()
    return result
  }
}
