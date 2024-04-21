package com.mrousavy.camera.core.types

import android.util.Size
import androidx.camera.video.FallbackStrategy
import androidx.camera.video.Quality
import androidx.camera.video.QualitySelector
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.core.InvalidTypeScriptUnionError
import kotlin.math.abs

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
  val videoStabilizationModes: List<VideoStabilizationMode>,
  val autoFocusSystem: AutoFocusSystem,
  val supportsVideoHdr: Boolean,
  val supportsPhotoHdr: Boolean,
  val supportsDepthCapture: Boolean
) {
  val photoSize: Size
    get() = Size(photoWidth, photoHeight)
  val videoSize: Size
    get() = Size(videoWidth, videoHeight)

  private val qualitySizes = mapOf<Quality, Int>(
    Quality.SD to 720 * 480,
    Quality.HD to 1280 * 720,
    Quality.FHD to 1920 * 1080,
    Quality.UHD to 3840 * 2160
  )

  private fun getQualitySelector(size: Size): QualitySelector {
    val targetSize = size.width * size.height
    val entry = qualitySizes.minBy { abs(targetSize - it.value) }
    val targetQuality = entry.key
    return QualitySelector.from(targetQuality, FallbackStrategy.higherQualityOrLowerThan(targetQuality))
  }

  val videoQualitySelector: QualitySelector
    get() = getQualitySelector(videoSize)

  companion object {
    fun fromJSValue(value: ReadableMap): CameraDeviceFormat {
      val modes = value.getArray("videoStabilizationModes") ?: throw InvalidTypeScriptUnionError("format", value.toString())
      val videoStabilizationModes = modes.toArrayList().map { VideoStabilizationMode.fromUnionValue(it as String) }

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
        videoStabilizationModes,
        autoFocusSystem,
        value.getBoolean("supportsVideoHdr"),
        value.getBoolean("supportsPhotoHdr"),
        value.getBoolean("supportsDepthCapture")
      )
    }
  }
}
