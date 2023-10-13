package com.mrousavy.camera.core

import com.mrousavy.camera.parsers.CameraDeviceFormat
import com.mrousavy.camera.parsers.Orientation
import com.mrousavy.camera.parsers.Torch

class CameraConfiguration {

  // Input
  var cameraId: String? = null

  // Outputs
  var photo: OutputConfiguration = OutputConfiguration.Disabled
  var video: OutputConfiguration = OutputConfiguration.Disabled
  var codeScanner: OutputConfiguration = OutputConfiguration.Disabled

  // Orientation
  var orientation: Orientation = Orientation.PORTRAIT

  // Format
  var format: CameraDeviceFormat? = null

  // Side-Props
  var fps: Int = 30
  var enableLowLightBoost = false
  var torch: Torch = Torch.OFF

  // Zoom
  var zoom: Double = 1.0

  // isActive (Start/Stop)
  var isActive = false

  // Audio Session
  var audio: OutputConfiguration = OutputConfiguration.Disabled

  sealed class OutputConfiguration {
    object Disabled: OutputConfiguration()
    class Enabled<T>(val config: T): OutputConfiguration()
  }
}
