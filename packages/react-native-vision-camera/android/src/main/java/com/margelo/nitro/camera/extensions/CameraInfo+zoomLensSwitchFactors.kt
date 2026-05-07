package com.margelo.nitro.camera.extensions

import android.annotation.SuppressLint
import android.hardware.camera2.CameraCharacteristics
import android.util.Log
import androidx.annotation.OptIn
import androidx.camera.camera2.interop.Camera2CameraInfo
import androidx.camera.camera2.interop.ExperimentalCamera2Interop
import androidx.camera.core.CameraInfo
import androidx.camera.lifecycle.ProcessCameraProvider
import com.margelo.nitro.NitroModules

@get:SuppressLint("RestrictedApi")
@get:OptIn(ExperimentalCamera2Interop::class)
val CameraInfo.zoomLensSwitchFactors: DoubleArray
  get() {
    val context = NitroModules.applicationContext ?: return doubleArrayOf()
    val selfFacing =
      Camera2CameraInfo
        .fromSafe(this)
        ?.getCameraCharacteristic(CameraCharacteristics.LENS_FACING)

    val provider =
      try {
        ProcessCameraProvider.getInstance(context).get()
      } catch (e: Exception) {
        Log.w("VisionCamera", "Failed to get ProcessCameraProvider", e)
        return doubleArrayOf()
      }

    val siblings =
      provider.availableCameraInfos.filter { info ->
        val facing =
          Camera2CameraInfo
            .fromSafe(info)
            ?.getCameraCharacteristic(CameraCharacteristics.LENS_FACING)
        facing != null && facing == selfFacing
      }
    if (siblings.size < 2) return doubleArrayOf()

    return siblings
      .asSequence()
      .map { it.intrinsicZoomRatio }
      .filter { it != CameraInfo.INTRINSIC_ZOOM_RATIO_UNKNOWN && it > 0f }
      .map { ratio ->
        if (ratio < 1.0f) {
          kotlin.math.round(ratio * 2f) / 2f
        } else {
          kotlin.math.round(ratio)
        }
      }.distinct()
      .sorted()
      .map { it.toDouble() }
      .toList()
      .toDoubleArray()
  }
