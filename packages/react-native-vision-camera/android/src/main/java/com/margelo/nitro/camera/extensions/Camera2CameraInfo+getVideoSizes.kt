package com.margelo.nitro.camera.extensions

import android.hardware.camera2.CameraCharacteristics
import android.util.Size
import androidx.annotation.OptIn
import androidx.camera.camera2.interop.Camera2CameraInfo
import androidx.camera.camera2.interop.ExperimentalCamera2Interop
import com.margelo.nitro.camera.utils.ImageFormatUtils

@OptIn(ExperimentalCamera2Interop::class)
fun Camera2CameraInfo.getVideoSizes(): Array<Size> {
  val streams =
    this.getCameraCharacteristic(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)
      ?: return emptyArray()
  val videoFormats = streams.outputFormats.filter { ImageFormatUtils.isVideoFormat(it) }
  val sizes = videoFormats.flatMap { streams.getOutputSizes(it).toList() }
  return sizes.distinct().toTypedArray()
}
