package com.mrousavy.camera.utils

import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.os.Build
import android.util.Log
import android.util.Size
import android.view.Surface
import com.mrousavy.camera.extensions.setDynamicRangeProfile

class RecordingSession(videoSize: Size,
                       fps: Int? = null,
                       hdrProfile: Long? = null): MediaCodec.Callback() {
  companion object {
    private const val TAG = "RecordingSession"
    // bytes per second
    private const val RECORDER_VIDEO_BITRATE = 10_000_000
    // key frames interval - once per second
    private const val IFRAME_INTERVAL = 1
  }

  private val mediaCodec: MediaCodec
  private val mimeType = if (hdrProfile != null) MediaFormat.MIMETYPE_VIDEO_HEVC else MediaFormat.MIMETYPE_VIDEO_AVC

  val surface: Surface

  init {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      throw Error("Video Recording is only supported on Devices running Android version 23 (M) or newer.")
    }

    val format = MediaFormat.createVideoFormat(mimeType, videoSize.width, videoSize.height)

    format.setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
    format.setInteger(MediaFormat.KEY_BIT_RATE, RECORDER_VIDEO_BITRATE)
    format.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, IFRAME_INTERVAL)
    if (fps != null) format.setInteger(MediaFormat.KEY_FRAME_RATE, fps)
    if (hdrProfile != null) format.setDynamicRangeProfile(hdrProfile)

    mediaCodec = MediaCodec.createEncoderByType(mimeType)
    mediaCodec.setCallback(this)
    mediaCodec.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
    // TODO: Get surface through mediaCodec.createInputSurface() + attach it to Camera
    surface = mediaCodec.createInputSurface()
  }

  fun start() {
    mediaCodec.start()
    // TODO: Start MediaMuxer to actually write the file + audio
  }

  fun stop() {
    mediaCodec.stop()
    mediaCodec.release()
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
