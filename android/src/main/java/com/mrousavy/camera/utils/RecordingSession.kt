package com.mrousavy.camera.utils

import android.content.Context
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaRecorder
import android.os.Build
import android.util.Log
import android.util.Size
import android.view.Surface
import com.mrousavy.camera.extensions.setDynamicRangeProfile
import java.io.File

class RecordingSession(context: Context,
                       enableAudio: Boolean,
                       videoSize: Size,
                       fps: Int? = null,
                       hdrProfile: Long? = null): MediaCodec.Callback() {
  companion object {
    private const val TAG = "RecordingSession"
    // bits per second
    private const val VIDEO_BIT_RATE = 10_000_000
    private const val AUDIO_SAMPLING_RATE = 44100
    private const val AUDIO_BIT_RATE = 16
  }

  val surface: Surface

  private val recorder: MediaRecorder
  private val encoder = if (hdrProfile != null) MediaRecorder.VideoEncoder.HEVC else MediaRecorder.VideoEncoder.H264
  private val outputFile: File


  init {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      throw Error("Video Recording is only supported on Devices running Android version 23 (M) or newer.")
    }

    outputFile = File.createTempFile("mrousavy", ".mp4", context.cacheDir)

    surface = MediaCodec.createPersistentInputSurface()

    recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) MediaRecorder(context) else MediaRecorder()

    if (enableAudio) recorder.setAudioSource(MediaRecorder.AudioSource.MIC)
    recorder.setVideoSource(MediaRecorder.VideoSource.SURFACE)

    recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
    recorder.setOutputFile(outputFile.absolutePath)
    recorder.setVideoEncodingBitRate(VIDEO_BIT_RATE)
    if (fps != null) recorder.setVideoFrameRate(fps)
    recorder.setVideoSize(videoSize.width, videoSize.height)

    recorder.setVideoEncoder(encoder)
    if (enableAudio) {
      recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
      recorder.setAudioEncodingBitRate(AUDIO_BIT_RATE)
      recorder.setAudioSamplingRate(AUDIO_SAMPLING_RATE)
    }
    recorder.setInputSurface(surface)

    recorder.setOnErrorListener { _, what, extra ->
      Log.e(TAG, "MediaRecorder Error: $what ($extra)")
    }
    recorder.setOnInfoListener { _, what, extra ->
      Log.i(TAG, "MediaRecorder Info: $what ($extra)")
    }
  }

  fun start() {
    Log.i(TAG, "Starting RecordingSession..")
    recorder.prepare()
    recorder.start()
  }

  fun stop() {
    Log.i(TAG, "Stopping RecordingSession..")
    recorder.stop()
  }

  fun pause() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
      throw Error("Pausing a recording is only supported on Devices running Android version 24 (N) or newer.")
    }
    Log.i(TAG, "Pausing Recording Session..")
    recorder.pause()
  }

  fun resume() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
      throw Error("Resuming a recording is only supported on Devices running Android version 24 (N) or newer.")
    }
    Log.i(TAG, "Resuming Recording Session..")
    recorder.resume()
  }

  override fun onInputBufferAvailable(codec: MediaCodec, index: Int) {
    Log.i(TAG, "onInputBufferAvailable($index)")
  }

  override fun onOutputBufferAvailable(codec: MediaCodec, index: Int, info: MediaCodec.BufferInfo) {
    Log.i(TAG, "onOutputBufferAvailable($index)")
  }

  override fun onError(codec: MediaCodec, e: MediaCodec.CodecException) {
    Log.e(TAG, "MediaCodec encountered an error! $e", e)
  }

  override fun onOutputFormatChanged(codec: MediaCodec, format: MediaFormat) {
    Log.i(TAG, "onOutputFormatChanged(...)")
  }
}
