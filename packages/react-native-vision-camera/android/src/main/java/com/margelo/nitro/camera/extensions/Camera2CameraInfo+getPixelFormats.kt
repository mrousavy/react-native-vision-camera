package com.margelo.nitro.camera.extensions

import android.hardware.camera2.CameraCharacteristics
import androidx.annotation.OptIn
import androidx.camera.camera2.interop.Camera2CameraInfo
import com.margelo.nitro.camera.PixelFormat
import com.margelo.nitro.camera.extensions.converters.fromImageFormat
import com.margelo.nitro.camera.utils.PixelRange

@OptIn(androidx.camera.camera2.interop.ExperimentalCamera2Interop::class)
fun Camera2CameraInfo.getPixelFormats(): Array<PixelFormat> {
  val streams =
    this.getCameraCharacteristic(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)
      ?: return emptyArray()
  return streams.outputFormats
    .map { PixelFormat.fromImageFormat(it, PixelRange.UNKNOWN) }
    .distinct()
    .toTypedArray()
}
