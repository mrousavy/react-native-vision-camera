package com.margelo.nitro.camera.extensions

import android.annotation.SuppressLint
import android.hardware.camera2.CameraCharacteristics
import android.os.Build
import android.util.Log
import androidx.annotation.OptIn
import androidx.camera.camera2.adapter.PhysicalCameraInfoAdapter
import androidx.camera.core.CameraInfo
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalLensFacing
import com.margelo.nitro.camera.CameraPosition

val CameraInfo.modelID: String
  @SuppressLint("RestrictedApi")
  get() {
    return "$implementationType:${position.name}"
  }

val CameraCharacteristics.focalLength: Float?
  get() {
    val focalLengths = this[CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS]
    return focalLengths?.firstOrNull()
  }

val CameraCharacteristics.supportsDistortionCorrection: Boolean
  get() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return false
    val distortionCorrectionModes =
      this[CameraCharacteristics.DISTORTION_CORRECTION_AVAILABLE_MODES] ?: return false
    return distortionCorrectionModes.contains(CameraCharacteristics.DISTORTION_CORRECTION_MODE_FAST) ||
      distortionCorrectionModes.contains(CameraCharacteristics.DISTORTION_CORRECTION_MODE_HIGH_QUALITY)
  }

val CameraInfo.localizedName: String
  get() {
    val positionString =
      when (this.position) {
        CameraPosition.EXTERNAL -> "External"
        CameraPosition.FRONT -> "Front"
        CameraPosition.BACK -> "Back"
        CameraPosition.UNSPECIFIED -> "Unknown"
      }
    val count =
      if (this is PhysicalCameraInfoAdapter) {
        "Physical "
      } else {
        when (this.physicalCameraInfos.size) {
          0, 1 -> ""
          2 -> "Dual "
          3 -> "Triple "
          4 -> "Quad "
          else -> ""
        }
      }
    return "$positionString ${count}Camera"
  }

val CameraInfo.position: CameraPosition
  @OptIn(ExperimentalLensFacing::class)
  get() {
    return when (lensFacing) {
      CameraSelector.LENS_FACING_BACK -> CameraPosition.BACK
      CameraSelector.LENS_FACING_FRONT -> CameraPosition.FRONT
      CameraSelector.LENS_FACING_EXTERNAL -> CameraPosition.EXTERNAL
      CameraSelector.LENS_FACING_UNKNOWN -> CameraPosition.UNSPECIFIED
      else -> {
        Log.w("VisionCamera", "Received unknown LENS_FACING: $lensFacing")
        CameraPosition.UNSPECIFIED
      }
    }
  }
