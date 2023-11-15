package com.mrousavy.camera.core

import android.view.Surface
import com.mrousavy.camera.types.CameraDeviceFormat
import com.mrousavy.camera.types.CodeType
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.PixelFormat
import com.mrousavy.camera.types.Torch
import com.mrousavy.camera.types.VideoStabilizationMode

data class CameraConfiguration(
  // Input
  var cameraId: String? = null,

  // Outputs
  var preview: Output<Preview> = Output.Disabled.create(),
  var photo: Output<Photo> = Output.Disabled.create(),
  var video: Output<Video> = Output.Disabled.create(),
  var codeScanner: Output<CodeScanner> = Output.Disabled.create(),

  // HDR
  var videoHdr: Boolean = false,
  var photoHdr: Boolean = false,

  // Orientation
  var orientation: Orientation = Orientation.PORTRAIT,

  // Format
  var format: CameraDeviceFormat? = null,

  // Side-Props
  var fps: Int? = null,
  var enableLowLightBoost: Boolean = false,
  var torch: Torch = Torch.OFF,
  var videoStabilizationMode: VideoStabilizationMode = VideoStabilizationMode.OFF,

  // Zoom
  var zoom: Float = 1f,

  // isActive (Start/Stop)
  var isActive: Boolean = false,

  // Audio Session
  var audio: Output<Audio> = Output.Disabled.create()
) {

  // Output<T> types, those need to be comparable
  data class CodeScanner(val codeTypes: List<CodeType>)
  data class Photo(val nothing: Unit)
  data class Video(val pixelFormat: PixelFormat, val enableFrameProcessor: Boolean)
  data class Audio(val nothing: Unit)
  data class Preview(val surface: Surface)

  @Suppress("EqualsOrHashCode")
  sealed class Output<T> {
    val isEnabled: Boolean
      get() = this is Enabled<*>
    class Disabled<T> private constructor() : Output<T>() {
      override fun equals(other: Any?): Boolean = other is Disabled<*>
      companion object {
        fun <T> create(): Disabled<T> = Disabled()
      }
    }
    class Enabled<T> private constructor(val config: T) : Output<T>() {
      override fun equals(other: Any?): Boolean = other is Enabled<*> && config == other.config
      companion object {
        fun <T> create(config: T): Enabled<T> = Enabled(config)
      }
    }
  }

  data class Difference(
    // Input Camera (cameraId and isActive)
    val deviceChanged: Boolean,
    // Outputs & Session (Photo, Video, CodeScanner, HDR, Format)
    val outputsChanged: Boolean,
    // Side-Props for CaptureRequest (fps, low-light-boost, torch, zoom, videoStabilization)
    val sidePropsChanged: Boolean
  ) {
    val hasAnyDifference: Boolean
      get() = sidePropsChanged || outputsChanged || deviceChanged
  }

  companion object {
    fun copyOf(other: CameraConfiguration?): CameraConfiguration = other?.copy() ?: CameraConfiguration()

    fun difference(left: CameraConfiguration?, right: CameraConfiguration): Difference {
      val deviceChanged = left?.cameraId != right.cameraId

      val outputsChanged = deviceChanged || // input device
        left?.photo != right.photo || left.video != right.video || left.codeScanner != right.codeScanner ||
        left.preview != right.preview || // outputs
        left.videoHdr != right.videoHdr || left.photoHdr != right.photoHdr || left.format != right.format // props that affect the outputs

      val sidePropsChanged = outputsChanged || // depend on outputs
        left?.torch != right.torch || left.enableLowLightBoost != right.enableLowLightBoost || left.fps != right.fps ||
        left.zoom != right.zoom || left.videoStabilizationMode != right.videoStabilizationMode || left.isActive != right.isActive

      return Difference(
        deviceChanged,
        outputsChanged,
        sidePropsChanged
      )
    }
  }
}
