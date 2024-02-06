package com.mrousavy.camera.core.outputs

import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraMetadata
import android.hardware.camera2.params.OutputConfiguration
import android.os.Build
import android.util.Log
import android.util.Size
import android.view.Surface
import androidx.annotation.RequiresApi
import java.io.Closeable

open class SurfaceOutput(val surface: Surface, val size: Size, val outputType: OutputType, val enableHdr: Boolean = false) : Closeable {
  companion object {
    const val TAG = "SurfaceOutput"

    private fun supportsOutputType(characteristics: CameraCharacteristics, outputType: OutputType): Boolean {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        val availableUseCases = characteristics.get(CameraCharacteristics.SCALER_AVAILABLE_STREAM_USE_CASES)
        if (availableUseCases != null) {
          if (availableUseCases.contains(outputType.toOutputType().toLong())) {
            return true
          }
        }
      }

      return false
    }
  }

  fun toOutputConfiguration(characteristics: CameraCharacteristics): OutputConfiguration {
    val result = OutputConfiguration(surface)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      if (enableHdr) {
        val profile = characteristics.get(CameraCharacteristics.REQUEST_RECOMMENDED_TEN_BIT_DYNAMIC_RANGE_PROFILE)
        if (profile != null) {
          result.dynamicRangeProfile = profile
          Log.i(TAG, "Using dynamic range profile ${result.dynamicRangeProfile} for $outputType output.")
        }
      }
      if (supportsOutputType(characteristics, outputType)) {
        result.streamUseCase = outputType.toOutputType().toLong()
        Log.i(TAG, "Using optimized stream use case ${result.streamUseCase} for $outputType output.")
      }
    }
    return result
  }

  val isRepeating: Boolean
    get() {
      return when (outputType) {
        OutputType.VIDEO, OutputType.PREVIEW, OutputType.VIDEO_AND_PREVIEW -> true
        OutputType.PHOTO -> false
      }
    }

  override fun toString(): String = "$outputType (${size.width} x ${size.height})"

  override fun close() {
    // close() does nothing by default
  }

  enum class OutputType {
    PHOTO,
    VIDEO,
    PREVIEW,
    VIDEO_AND_PREVIEW;

    @RequiresApi(Build.VERSION_CODES.TIRAMISU)
    fun toOutputType(): Int =
      when (this) {
        PHOTO -> CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_STILL_CAPTURE
        VIDEO -> CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_VIDEO_RECORD
        PREVIEW -> CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_PREVIEW
        VIDEO_AND_PREVIEW -> CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_PREVIEW_VIDEO_STILL
      }
  }
}
