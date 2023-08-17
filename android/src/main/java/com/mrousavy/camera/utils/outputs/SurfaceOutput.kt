package com.mrousavy.camera.utils.outputs

import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraMetadata
import android.hardware.camera2.params.OutputConfiguration
import android.os.Build
import android.util.Log
import android.util.Size
import android.view.Surface
import androidx.annotation.RequiresApi
import java.io.Closeable

/**
 * A general-purpose Camera Output that writes to a [Surface]
 */
open class SurfaceOutput(val surface: Surface,
                         val size: Size,
                         val outputType: OutputType,
                         private val dynamicRangeProfile: Long? = null,
                         private val closeSurfaceOnEnd: Boolean = false): Closeable {
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

  @RequiresApi(Build.VERSION_CODES.N)
  fun toOutputConfiguration(characteristics: CameraCharacteristics): OutputConfiguration {
    val result = OutputConfiguration(surface)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      if (dynamicRangeProfile != null) {
        result.dynamicRangeProfile = dynamicRangeProfile
        Log.i(TAG, "Using dynamic range profile ${result.dynamicRangeProfile} for $outputType output.")
      }
      if (supportsOutputType(characteristics, outputType)) {
        result.streamUseCase = outputType.toOutputType().toLong()
        Log.i(TAG, "Using optimized stream use case ${result.streamUseCase} for $outputType output.")
      }
    }
    return result
  }

  override fun toString(): String {
    return "$outputType (${size.width} x ${size.height})"
  }

  override fun close() {
    if (closeSurfaceOnEnd) {
      surface.release()
    }
  }

  enum class OutputType {
    PHOTO,
    VIDEO,
    PREVIEW,
    VIDEO_AND_PREVIEW;

    @RequiresApi(Build.VERSION_CODES.TIRAMISU)
    fun toOutputType(): Int {
      return when(this) {
        PHOTO -> CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_STILL_CAPTURE
        VIDEO -> CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_VIDEO_RECORD
        PREVIEW -> CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_PREVIEW
        VIDEO_AND_PREVIEW -> CameraMetadata.SCALER_AVAILABLE_STREAM_USE_CASES_PREVIEW_VIDEO_STILL
      }
    }
  }
}
