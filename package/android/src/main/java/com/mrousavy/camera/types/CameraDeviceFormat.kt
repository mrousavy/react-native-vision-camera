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
  val videoStabilizationModes: List<VideoStabilizationMode>,
  val autoFocusSystem: AutoFocusSystem,
  val supportsVideoHdr: Boolean,
  val supportsPhotoHdr: Boolean,
  val pixelFormats: List<PixelFormat>,
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
        videoStabilizationModes,
        autoFocusSystem,
        value.getBoolean("supportsVideoHdr"),
        value.getBoolean("supportsPhotoHdr"),
        pixelFormats,
        value.getBoolean("supportsDepthCapture")
      )
    }
  }
}
