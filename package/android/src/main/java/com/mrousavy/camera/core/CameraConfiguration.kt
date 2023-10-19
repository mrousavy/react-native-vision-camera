package com.mrousavy.camera.core

import com.mrousavy.camera.parsers.CameraDeviceFormat
import com.mrousavy.camera.parsers.CodeType
import com.mrousavy.camera.parsers.Orientation
import com.mrousavy.camera.parsers.PixelFormat
import com.mrousavy.camera.parsers.Torch

data class CameraConfiguration(
  // Input
  var cameraId: String? = null,

  // Outputs
  var photo: Output<Photo> = Output.Disabled.create(),
  var video: Output<Video> = Output.Disabled.create(),
  var codeScanner: Output<CodeScanner> = Output.Disabled.create(),

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
  var audio: Output<Audio> = Output.Disabled.create()
) {

  data class CodeScanner(val codeTypes: List<CodeType>)
  class Photo
  data class Video(
    val pixelFormat: PixelFormat,
    var enableHdr: Boolean,
    val enableFrameProcessor: Boolean
  )
  class Audio

  @Suppress("EqualsOrHashCode")
  sealed class Output<T> {
    val isEnabled: Boolean
      get() = this is Enabled<*>
    class Disabled<T> private constructor(): Output<T>() {
      override fun equals(other: Any?): Boolean {
        return other is Disabled<*>
      }
      companion object {
        fun <T> create(): Disabled<T> = Disabled()
      }
    }
    class Enabled<T> private constructor(val config: T): Output<T>() {
      override fun equals(other: Any?): Boolean {
        return other is Enabled<*> && config == other.config
      }
      companion object {
        fun <T> create(config: T): Enabled<T> = Enabled(config)
      }
    }
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
