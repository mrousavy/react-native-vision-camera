package com.mrousavy.camera.utils

import android.content.Context
import android.media.Image
import android.media.ImageWriter
import android.media.MediaCodec
import android.media.MediaRecorder
import android.os.Build
import android.util.Log
import android.util.Size
import android.view.Surface
import com.mrousavy.camera.utils.outputs.CameraOutputs
import java.io.Closeable
import java.io.File

class RecordingSession(context: Context,
                       private val enableAudio: Boolean,
                       private val videoSize: Size,
                       private val fps: Int? = null,
                       private val hdrProfile: Long? = null,
                       private val callback: (video: Video) -> Unit): Closeable {
  companion object {
    private const val TAG = "RecordingSession"
    // bits per second
    private const val VIDEO_BIT_RATE = 10_000_000
    private const val AUDIO_SAMPLING_RATE = 44100
    private const val AUDIO_BIT_RATE = 16
  }

  data class Video(val path: String, val durationMs: Long)

  private val recorder: MediaRecorder
  private val outputFile: File
  private var startTime: Long? = null
  private var imageWriter: ImageWriter? = null
  val surface: Surface

  init {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      throw Error("Video Recording is only supported on Devices running Android version 23 (M) or newer.")
    }

    surface = MediaCodec.createPersistentInputSurface()

    outputFile = File.createTempFile("mrousavy", ".mp4", context.cacheDir)

    Log.i(TAG, "Creating RecordingSession for ${outputFile.absolutePath}")

    recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) MediaRecorder(context) else MediaRecorder()

    if (enableAudio) recorder.setAudioSource(MediaRecorder.AudioSource.MIC)
    recorder.setVideoSource(MediaRecorder.VideoSource.SURFACE)

    recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
    recorder.setOutputFile(outputFile.absolutePath)
    recorder.setVideoEncodingBitRate(VIDEO_BIT_RATE)
    recorder.setVideoSize(videoSize.width, videoSize.height)
    if (fps != null) recorder.setVideoFrameRate(fps)

    if (hdrProfile != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      recorder.setVideoEncoder(MediaRecorder.VideoEncoder.HEVC)
      Log.i(TAG, "Using HDR HEVC encoder..")
    } else {
      Log.i(TAG, "Using standard H264 encoder..")
      recorder.setVideoEncoder(MediaRecorder.VideoEncoder.H264)
    }
    if (enableAudio) {
      Log.i(TAG, "Adding Audio Channel..")
      recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
      recorder.setAudioEncodingBitRate(AUDIO_BIT_RATE)
      recorder.setAudioSamplingRate(AUDIO_SAMPLING_RATE)
    }
    recorder.setInputSurface(surface)

    recorder.setOnErrorListener { _, what, extra ->
      Log.e(TAG, "MediaRecorder Error: $what ($extra)")
      stop()
    }
    recorder.setOnInfoListener { _, what, extra ->
      Log.i(TAG, "MediaRecorder Info: $what ($extra)")
    }
  }

  fun start() {
    synchronized(this) {
      Log.i(TAG, "Starting RecordingSession..")
      recorder.prepare()
      recorder.start()
      startTime = System.currentTimeMillis()
    }
  }

  fun stop() {
    synchronized(this) {
      Log.i(TAG, "Stopping RecordingSession..")
      try {
        recorder.stop()
        // TODO: Re-configure the session now.
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
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
        throw Error("Pausing a recording is only supported on Devices running Android version 24 (N) or newer.")
      }
      Log.i(TAG, "Pausing Recording Session..")
      recorder.pause()
    }
  }

  fun resume() {
    synchronized(this) {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
        throw Error("Resuming a recording is only supported on Devices running Android version 24 (N) or newer.")
      }
      Log.i(TAG, "Resuming Recording Session..")
      recorder.resume()
    }
  }

  override fun close() {
    synchronized(this) {
      stop()
      recorder.release()

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        imageWriter?.close()
        imageWriter = null
      }
    }
  }


  fun appendImage(image: Image) {
    synchronized(this) {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
        throw Error("Video Recording is only supported on Devices running Android version 23 (M) or newer.")
      }

      if (imageWriter == null) {
        imageWriter = ImageWriter.newInstance(surface, CameraOutputs.VIDEO_OUTPUT_BUFFER_SIZE)
      }
      imageWriter!!.queueInputImage(image)
    }
  }

  override fun toString(): String {
    val hdr = if (hdrProfile != null) "HDR" else "SDR"
    val audio = if (enableAudio) "with audio" else "without audio"
    return "${videoSize.width} x ${videoSize.height} @ $fps FPS $hdr RecordingSession ($audio)"
  }
}
