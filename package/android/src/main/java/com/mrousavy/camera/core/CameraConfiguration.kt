package com.mrousavy.camera.core

import androidx.camera.core.Preview.SurfaceProvider
import com.mrousavy.camera.core.types.CameraDeviceFormat
import com.mrousavy.camera.core.types.CodeType
import com.mrousavy.camera.core.types.Orientation
import com.mrousavy.camera.core.types.PixelFormat
import com.mrousavy.camera.core.types.QualityBalance
import com.mrousavy.camera.core.types.Torch
import com.mrousavy.camera.core.types.VideoStabilizationMode

data class CameraConfiguration(
  // Input
  var cameraId: String? = null,

  // Outputs
  var preview: Output<Preview> = Output.Disabled.create(),
  var photo: Output<Photo> = Output.Disabled.create(),
  var video: Output<Video> = Output.Disabled.create(),
  var frameProcessor: Output<FrameProcessor> = Output.Disabled.create(),
  var codeScanner: Output<CodeScanner> = Output.Disabled.create(),
  var enableLocation: Boolean = false,

  // Orientation
  var orientation: Orientation = Orientation.PORTRAIT,

  // Format
  var format: CameraDeviceFormat? = null,

  // Side-Props
  var fps: Int? = null,
  var enableLowLightBoost: Boolean = false,
  var torch: Torch = Torch.OFF,
  var videoStabilizationMode: VideoStabilizationMode = VideoStabilizationMode.OFF,
  var exposure: Double? = null,

  // Zoom
  var zoom: Float = 1f,

  // isActive (Start/Stop)
  var isActive: Boolean = false,

  // Audio Session
  var audio: Output<Audio> = Output.Disabled.create()
) {
  // Output<T> types, those need to be comparable
  data class CodeScanner(val codeTypes: List<CodeType>)
  data class Photo(val enableHdr: Boolean, val photoQualityBalance: QualityBalance)
  data class Video(val enableHdr: Boolean)
  data class FrameProcessor(val pixelFormat: PixelFormat)
  data class Audio(val nothing: Unit)
  data class Preview(val surfaceProvider: SurfaceProvider)

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
    // Input Camera (cameraId)
    val deviceChanged: Boolean,
    // Outputs & Session (Photo, Video, CodeScanner, HDR, Format)
    val outputsChanged: Boolean,
    // Side-Props for CaptureRequest (fps, low-light-boost, torch, zoom, videoStabilization)
    val sidePropsChanged: Boolean,
    // (isActive) changed
    val isActiveChanged: Boolean,
    // (locationChanged) changed
    val locationChanged: Boolean
  ) {
    val hasChanges: Boolean
      get() = deviceChanged || outputsChanged || sidePropsChanged || isActiveChanged
  }

  /**
   * Throw this to abort a call to configure { ... } and apply no changes.
   */
  class AbortThrow : Throwable()

  companion object {
    fun copyOf(other: CameraConfiguration?): CameraConfiguration = other?.copy() ?: CameraConfiguration()

    fun difference(left: CameraConfiguration?, right: CameraConfiguration): Difference {
      // input device
      val deviceChanged = left?.cameraId != right.cameraId

      // outputs
      val outputsChanged = left?.photo != right.photo ||
        left.video != right.video ||
        left.enableLowLightBoost != right.enableLowLightBoost ||
        left.videoStabilizationMode != right.videoStabilizationMode ||
        left.frameProcessor != right.frameProcessor ||
        left.codeScanner != right.codeScanner ||
        left.preview != right.preview ||
        left.format != right.format ||
        left.fps != right.fps

      // repeating request
      val sidePropsChanged = outputsChanged ||
        left?.torch != right.torch ||
        left.zoom != right.zoom ||
        left.exposure != right.exposure

      val isActiveChanged = left?.isActive != right.isActive

      val locationChanged = left?.enableLocation != right.enableLocation

      return Difference(
        deviceChanged,
        outputsChanged,
        sidePropsChanged,
        isActiveChanged,
        locationChanged
      )
    }
  }
}
