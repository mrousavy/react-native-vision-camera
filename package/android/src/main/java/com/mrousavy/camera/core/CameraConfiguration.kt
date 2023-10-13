package com.mrousavy.camera.core

import com.mrousavy.camera.parsers.CameraDeviceFormat
import com.mrousavy.camera.parsers.Orientation
import com.mrousavy.camera.parsers.Torch

data class CameraConfiguration(
  // Input
  var cameraId: String? = null,

  // Outputs
  var photo: OutputConfiguration = OutputConfiguration.Disabled,
  var video: OutputConfiguration = OutputConfiguration.Disabled,
  var codeScanner: OutputConfiguration = OutputConfiguration.Disabled,

  // Orientation
  var orientation: Orientation = Orientation.PORTRAIT,

  // Format
  var format: CameraDeviceFormat? = null,

  // Side-Props
  var fps: Int = 30,
  var enableLowLightBoost: Boolean = false,
  var torch: Torch = Torch.OFF,

  // Zoom
  var zoom: Double = 1.0,

  // isActive (Start/Stop)
  var isActive: Boolean = false,

  // Audio Session
  var audio: OutputConfiguration = OutputConfiguration.Disabled
) {

  sealed class OutputConfiguration {
    object Disabled: OutputConfiguration()
    class Enabled<T>(val config: T): OutputConfiguration()
  }

  data class Difference(
      val deviceChanged: Boolean,
      val outputsChanged: Boolean,
      val formatChanged: Boolean,
      val sidePropsChanged: Boolean,
      val zoomChanged: Boolean,
  )

  companion object {
    fun copyOf(other: CameraConfiguration?): CameraConfiguration {
      return other?.copy() ?: CameraConfiguration()
    }

    fun difference(left: CameraConfiguration?, right: CameraConfiguration): Difference {
      val deviceChanged = left?.cameraId != right.cameraId
      val outputsChanged = deviceChanged || left?.photo != right.photo || left?.video != right.video || left?.codeScanner != right.codeScanner
      val formatChanged = left?.format != right.format
      val sidePropsChanged = left?.fps != right.fps || left?.enableLowLightBoost != right.enableLowLightBoost || left?.torch != right.torch
      val zoomChanged = left?.zoom != right.zoom

      return Difference(
          deviceChanged,
          outputsChanged,
          formatChanged,
          sidePropsChanged,
          zoomChanged
      )
    }
  }
}
