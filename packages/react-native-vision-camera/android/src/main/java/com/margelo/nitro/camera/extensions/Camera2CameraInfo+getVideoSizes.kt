package com.margelo.nitro.camera.extensions

import android.annotation.SuppressLint
import android.hardware.camera2.CameraCharacteristics
import android.util.Size
import androidx.annotation.OptIn
import androidx.camera.camera2.interop.Camera2CameraInfo
import androidx.camera.camera2.interop.ExperimentalCamera2Interop
import androidx.camera.core.CameraInfo
import androidx.camera.core.DynamicRange
import androidx.camera.video.Recorder
import androidx.camera.video.VideoCapabilities
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

@OptIn(ExperimentalCamera2Interop::class)
fun CameraInfo.getVideoSizes(): Array<Size> {
  val camera2Sizes = Camera2CameraInfo.fromSafe(this)?.getVideoSizes().orEmpty()
  val recorderSizes =
    listOf(
      Recorder.VIDEO_CAPABILITIES_SOURCE_CAMCORDER_PROFILE,
      Recorder.VIDEO_CAPABILITIES_SOURCE_CODEC_CAPABILITIES,
    ).flatMap { source ->
      getRecorderVideoSizes(source)
    }

  return (recorderSizes + camera2Sizes).distinct().toTypedArray()
}

@SuppressLint("RestrictedApi")
private fun CameraInfo.getRecorderVideoSizes(source: Int): List<Size> {
  val capabilities = Recorder.getVideoCapabilities(this, source)
  val dynamicRanges = capabilities.supportedDynamicRanges.ifEmpty { setOf(DynamicRange.SDR) }
  return dynamicRanges.flatMap { dynamicRange ->
    capabilities.getVideoSizes(dynamicRange)
  }
}

@SuppressLint("RestrictedApi")
private fun VideoCapabilities.getVideoSizes(dynamicRange: DynamicRange): List<Size> {
  return getSupportedQualities(dynamicRange).mapNotNull { quality ->
    getResolution(quality, dynamicRange)
  }
}
