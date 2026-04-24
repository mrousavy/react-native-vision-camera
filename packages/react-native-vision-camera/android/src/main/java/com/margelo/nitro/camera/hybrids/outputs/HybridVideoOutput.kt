package com.margelo.nitro.camera.hybrids.outputs

import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
import androidx.camera.core.DynamicRange
import androidx.camera.video.FileOutputOptions
import androidx.camera.video.Recorder
import androidx.camera.video.VideoCapture
import com.margelo.nitro.NitroModules
import com.margelo.nitro.camera.CameraOrientation
import com.margelo.nitro.camera.HybridCameraVideoOutputSpec
import com.margelo.nitro.camera.HybridRecorderSpec
import com.margelo.nitro.camera.MediaType
import com.margelo.nitro.camera.MirrorMode
import com.margelo.nitro.camera.RecorderSettings
import com.margelo.nitro.camera.Size
import com.margelo.nitro.camera.TargetStabilizationMode
import com.margelo.nitro.camera.VideoCodec
import com.margelo.nitro.camera.VideoOutputOptions
import com.margelo.nitro.camera.VideoOutputSettings
import com.margelo.nitro.camera.extensions.converters.fromMirrorMode
import com.margelo.nitro.camera.extensions.converters.toDynamicRange
import com.margelo.nitro.camera.extensions.converters.toMirrorMode
import com.margelo.nitro.camera.extensions.getClosestAspectRatio
import com.margelo.nitro.camera.extensions.surfaceRotation
import com.margelo.nitro.camera.extensions.toQualitySelector
import com.margelo.nitro.camera.hybrids.recording.HybridVideoRecorder
import com.margelo.nitro.camera.public.NativeCameraOutput
import com.margelo.nitro.camera.public.NativeLocation
import com.margelo.nitro.core.Promise
import com.margelo.nitro.core.resolved
import java.io.File

class HybridVideoOutput(
  private val options: VideoOutputOptions,
) : HybridCameraVideoOutputSpec(),
  NativeCameraOutput {
  override val mediaType: MediaType = MediaType.VIDEO
  override var outputOrientation: CameraOrientation = CameraOrientation.UP
    set(value) {
      field = value
      videoCapture?.targetRotation = value.surfaceRotation
    }

  private val context: Context
    get() = NitroModules.applicationContext ?: throw Error("No ApplicationContext!")

  private val videoOutput: Recorder
  private var videoCapture: VideoCapture<*>? = null
  private val videoCapabilitiesSource: Int
    get() {
      if (options.enableHigherResolutionCodecs == true) {
        // Use SOURCE_CODEC instead of CAMCORDER for resolutions/codecs - this allows using
        // formats with higher video resolution.
        // If this is not enabled, a high-resolution video format may auto-fallback to a lower
        // resolution one that is supported by CAMCORDER.
        return Recorder.VIDEO_CAPABILITIES_SOURCE_CODEC_CAPABILITIES
      } else {
        // CAMCORDER is a safe default for available qualities.
        return Recorder.VIDEO_CAPABILITIES_SOURCE_CAMCORDER_PROFILE
      }
    }
  override val mirrorMode: MirrorMode
    get() {
      val videoCapture = videoCapture ?: return MirrorMode.AUTO
      return MirrorMode.fromMirrorMode(videoCapture.mirrorMode)
    }

  init {
    videoOutput =
      Recorder
        .Builder()
        .apply {
          if (options.targetBitRate != null) {
            // Set custom target bit-rate.
            setTargetVideoEncodingBitRate(options.targetBitRate.toInt())
          }
          // Set the capabilities source - this can unlock higher resolutions.
          setVideoCapabilitiesSource(videoCapabilitiesSource)

          // TODO: Maybe CameraX can implement an API that allows us to just pass
          //       a `Size` (or a `ResolutionSelector`), as this is what we already have.
          // Sets the Quality itself (UHD, FHD, ...)
          val qualitySelector = options.targetResolution.toQualitySelector()
          setQualitySelector(qualitySelector)

          // Sets the aspect ratio (if there are multiple UHD qualities choose the one we wanted)
          val aspect = options.targetResolution.getClosestAspectRatio()
          setAspectRatio(aspect)
        }.build()
  }

  override fun createUseCase(
    mirrorMode: MirrorMode,
    config: NativeCameraOutput.Config,
  ): NativeCameraOutput.PreparedUseCase {
    // VideoCapture is our actual UseCase
    val videoCapture =
      VideoCapture
        .Builder(videoOutput)
        .apply {
          // isMirrored={...}
          setMirrorMode(mirrorMode.toMirrorMode())
          // orientation from previous value
          setTargetRotation(outputOrientation.surfaceRotation)

          // Set the Dynamic Range (HDR, SDR, 10-bit, Dolby, ...)
          val dynamicRange = config.videoDynamicRange?.toDynamicRange()
          if (dynamicRange != null) {
            setDynamicRange(dynamicRange)
          }

          // stabilizationMode={...}
          when (config.videoStabilizationMode) {
            TargetStabilizationMode.OFF -> {
              // Video Stabilization explicitly disabled
              setVideoStabilizationEnabled(false)
            }
            null, TargetStabilizationMode.AUTO -> {
              // Unspecified - might be enabled, might be disabled.
            }
            else -> {
              // Video Stabilization enabled (STANDARD, CINEMATIC, etc they're all the same on Android)
              setVideoStabilizationEnabled(true)
            }
          }
        }.build()

    return NativeCameraOutput.PreparedUseCase(videoCapture) {
      this.videoCapture = videoCapture
    }
  }

  override fun getSupportedVideoCodecs(): Array<VideoCodec> {
    // TODO: CameraX does not support getting available codecs.
    return emptyArray()
  }

  override fun setOutputSettings(settings: VideoOutputSettings): Promise<Unit> {
    // TODO: CameraX does not support setting custom settings.
    return Promise.resolved()
  }

  @SuppressLint("MissingPermission")
  override fun createRecorder(settings: RecorderSettings): Promise<HybridRecorderSpec> {
    return Promise.async {
      // Create .mp4 file in temp directory
      val file = File.createTempFile("VisionCamera_", "mp4")

      // Prepare output options
      val fileOutputOptions =
        FileOutputOptions
          .Builder(file)
          .apply {
            if (settings.location != null) {
              // location={..} metadata
              val location = settings.location as? NativeLocation ?: throw Error("Location is not of type `NativeLocation`!")
              setLocation(location.location)
            }
            if (settings.maxDuration != null) {
              // maxDuration={..} - CameraX finalizes successfully when reached.
              setDurationLimitMillis((settings.maxDuration * 1000.0).toLong())
            }
            if (settings.maxFileSize != null) {
              // maxFileSize={..} - CameraX finalizes successfully when reached.
              setFileSizeLimit(settings.maxFileSize.toLong())
            }
          }.build()
      var pendingRecording = videoOutput.prepareRecording(context, fileOutputOptions)
      if (options.enableAudio == true) {
        pendingRecording = pendingRecording.withAudioEnabled()
      }
      if (options.enablePersistentRecorder == true) {
        pendingRecording = pendingRecording.asPersistentRecording()
      }

      // Create Prepared Recorder
      return@async HybridVideoRecorder(pendingRecording, file)
    }
  }
}
