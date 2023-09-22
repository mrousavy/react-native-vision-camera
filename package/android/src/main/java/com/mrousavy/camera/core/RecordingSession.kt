package com.mrousavy.camera.core

import android.content.Context
import android.hardware.camera2.params.DynamicRangeProfiles
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaRecorder
import android.os.Build
import android.util.Log
import android.util.Size
import android.view.Surface
import com.mrousavy.camera.RecorderError
import com.mrousavy.camera.parsers.Orientation
import com.mrousavy.camera.parsers.VideoCodec
import com.mrousavy.camera.parsers.VideoFileType
import java.io.File

class RecordingSession(
  context: Context,
  val size: Size,
  private val enableAudio: Boolean,
  private val fps: Int = 30,
  private val dynamicRangeProfile: Long? = null,
  private val codec: VideoCodec = VideoCodec.H264,
  private val orientation: Orientation,
  private val fileType: VideoFileType = VideoFileType.MP4,
  private val callback: (video: Video) -> Unit,
  private val onError: (error: RecorderError) -> Unit
) {
  companion object {
    private const val TAG = "RecordingSession"

    // bits per second
    private const val VIDEO_BIT_RATE = 10_000_000
    private const val VIDEO_IFRAME_INTERVAL = 1
    private const val AUDIO_SAMPLING_RATE = 44_100
    private const val AUDIO_BIT_RATE = 16 * AUDIO_SAMPLING_RATE
    private const val AUDIO_CHANNELS = 1
  }

  data class Video(val path: String, val durationMs: Long)

  private val recorder: MediaCodec
  private val outputFile: File
  private var startTime: Long? = null
  val surface: Surface

  init {
    outputFile = File.createTempFile("mrousavy", fileType.toExtension(), context.cacheDir)
    Log.i(TAG, "Creating RecordingSession for ${outputFile.absolutePath}")

    // Set up either H264 (mp4) or H265 (hevc) profile
    val mimeType = when (codec) {
      VideoCodec.H264 -> MediaFormat.MIMETYPE_VIDEO_AVC
      VideoCodec.H265 -> MediaFormat.MIMETYPE_VIDEO_HEVC
    }
    recorder = MediaCodec.createEncoderByType(mimeType)

    Log.i(TAG, "Creating ${size.width}x${size.height}@$fps $codec MediaCodec")
    val format = MediaFormat.createVideoFormat(mimeType, size.width, size.height)

    // Configure standard video metadata
    format.setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
    format.setInteger(MediaFormat.KEY_BIT_RATE, VIDEO_BIT_RATE)
    format.setInteger(MediaFormat.KEY_FRAME_RATE, fps)
    format.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, VIDEO_IFRAME_INTERVAL)

    // Configure HDR
    val codecProfile = when (dynamicRangeProfile) {
      DynamicRangeProfiles.HLG10 -> MediaCodecInfo.CodecProfileLevel.HEVCProfileMain10
      DynamicRangeProfiles.HDR10 -> MediaCodecInfo.CodecProfileLevel.HEVCProfileMain10HDR10
      DynamicRangeProfiles.HDR10_PLUS -> MediaCodecInfo.CodecProfileLevel.HEVCProfileMain10HDR10Plus
      else -> -1
    }
    if (codecProfile != -1) {
      format.setInteger(MediaFormat.KEY_PROFILE, codecProfile)
      format.setInteger(MediaFormat.KEY_COLOR_STANDARD, MediaFormat.COLOR_STANDARD_BT2020)
      format.setInteger(MediaFormat.KEY_COLOR_RANGE, MediaFormat.COLOR_RANGE_FULL)
      format.setInteger(MediaFormat.KEY_COLOR_TRANSFER, getTransferFunction(codecProfile))
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        format.setFeatureEnabled(MediaCodecInfo.CodecCapabilities.FEATURE_HdrEditing, true)
      }
    }
    Log.i(TAG, "Configuring MediaCodec with format: $format")

    // Configure MediaCodec, after that the Surface is ready
    recorder.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
    surface = recorder.createInputSurface()

    Log.i(TAG, "Created $this!")
  }

  private fun getTransferFunction(codecProfile: Int) = when (codecProfile) {
    MediaCodecInfo.CodecProfileLevel.HEVCProfileMain10 -> MediaFormat.COLOR_TRANSFER_HLG
    MediaCodecInfo.CodecProfileLevel.HEVCProfileMain10HDR10 -> MediaFormat.COLOR_TRANSFER_ST2084
    MediaCodecInfo.CodecProfileLevel.HEVCProfileMain10HDR10Plus -> MediaFormat.COLOR_TRANSFER_ST2084
    else -> MediaFormat.COLOR_TRANSFER_SDR_VIDEO
  }

  fun start() {
    synchronized(this) {
      Log.i(TAG, "Starting RecordingSession..")
      recorder.start()
      startTime = System.currentTimeMillis()
    }
  }

  fun stop() {
    synchronized(this) {
      Log.i(TAG, "Stopping RecordingSession..")
      try {
        recorder.stop()
        recorder.release()
      } catch (e: Error) {
        Log.e(TAG, "Failed to stop MediaRecorder!", e)
      }

      val stopTime = System.currentTimeMillis()
      val durationMs = stopTime - (startTime ?: stopTime)
      callback(Video(outputFile.absolutePath, durationMs))
    }
  }

  fun pause() {
    synchronized(this) {
      Log.i(TAG, "Pausing Recording Session..")
      // TODO: Confirm pause() works
      recorder.stop()
    }
  }

  fun resume() {
    synchronized(this) {
      Log.i(TAG, "Resuming Recording Session..")
      // TODO: Confirm resume() works
      recorder.start()
    }
  }

  override fun toString(): String {
    val audio = if (enableAudio) "with audio" else "without audio"
    return "${size.width} x ${size.height} @ $fps FPS $codec $fileType $orientation RecordingSession ($audio)"
  }
}
