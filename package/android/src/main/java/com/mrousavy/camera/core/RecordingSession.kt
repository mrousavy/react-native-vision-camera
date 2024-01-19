package com.mrousavy.camera.core

import android.content.Context
import android.media.MediaCodec
import android.media.MediaRecorder
import android.os.Build
import android.util.Log
import android.util.Size
import android.view.Surface
import com.facebook.common.statfs.StatFsHelper
import com.mrousavy.camera.extensions.getRecommendedBitRate
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.RecordVideoOptions
import com.mrousavy.camera.utils.FileUtils
import java.io.File

class RecordingSession(
  context: Context,
  val cameraId: String,
  val size: Size,
  private val enableAudio: Boolean,
  private val fps: Int? = null,
  private val hdr: Boolean = false,
  private val orientation: Orientation,
  private val options: RecordVideoOptions,
  private val callback: (video: Video) -> Unit,
  private val onError: (error: CameraError) -> Unit
) {
  companion object {
    private const val TAG = "RecordingSession"

    private const val AUDIO_SAMPLING_RATE = 44_100
    private const val AUDIO_BIT_RATE = 16 * AUDIO_SAMPLING_RATE
    private const val AUDIO_CHANNELS = 1
  }

  data class Video(val path: String, val durationMs: Long, val size: Size)

  private val bitRate = getBitRate()
  private val recorder: MediaRecorder
  private val outputFile: File
  private var startTime: Long? = null
  val surface: Surface = MediaCodec.createPersistentInputSurface()

  // TODO: Implement HDR
  init {
    outputFile = FileUtils.createTempFile(context, options.fileType.toExtension())

    Log.i(TAG, "Creating RecordingSession for ${outputFile.absolutePath}")

    recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) MediaRecorder(context) else MediaRecorder()

    if (enableAudio) recorder.setAudioSource(MediaRecorder.AudioSource.CAMCORDER)
    recorder.setVideoSource(MediaRecorder.VideoSource.SURFACE)

    recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)

    recorder.setOutputFile(outputFile.absolutePath)
    recorder.setVideoEncodingBitRate(bitRate)
    recorder.setVideoSize(size.height, size.width)
    recorder.setMaxFileSize(getMaxFileSize())
    if (fps != null) recorder.setVideoFrameRate(fps)

    Log.i(TAG, "Using ${options.videoCodec} Video Codec at ${bitRate / 1_000_000.0} Mbps..")
    recorder.setVideoEncoder(options.videoCodec.toVideoEncoder())
    if (enableAudio) {
      Log.i(TAG, "Adding Audio Channel..")
      recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
      recorder.setAudioEncodingBitRate(AUDIO_BIT_RATE)
      recorder.setAudioSamplingRate(AUDIO_SAMPLING_RATE)
      recorder.setAudioChannels(AUDIO_CHANNELS)
    }
    recorder.setInputSurface(surface)
    // recorder.setOrientationHint(orientation.toDegrees())

    recorder.setOnErrorListener { _, what, extra ->
      Log.e(TAG, "MediaRecorder Error: $what ($extra)")
      stop()
      val name = when (what) {
        MediaRecorder.MEDIA_RECORDER_ERROR_UNKNOWN -> "unknown"
        MediaRecorder.MEDIA_ERROR_SERVER_DIED -> "server-died"
        else -> "unknown"
      }
      onError(RecorderError(name, extra))
    }
    recorder.setOnInfoListener { _, what, extra ->
      Log.i(TAG, "MediaRecorder Info: $what ($extra)")
      if (what == MediaRecorder.MEDIA_RECORDER_INFO_MAX_FILESIZE_REACHED) {
        onError(InsufficientStorageError())
      }
    }

    Log.i(TAG, "Created $this!")
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
        recorder.release()
      } catch (e: Error) {
        Log.e(TAG, "Failed to stop MediaRecorder!", e)
      }

      val stopTime = System.currentTimeMillis()
      val durationMs = stopTime - (startTime ?: stopTime)
      callback(Video(outputFile.absolutePath, durationMs, size))
    }
  }

  fun pause() {
    synchronized(this) {
      Log.i(TAG, "Pausing Recording Session..")
      recorder.pause()
    }
  }

  fun resume() {
    synchronized(this) {
      Log.i(TAG, "Resuming Recording Session..")
      recorder.resume()
    }
  }

  /**
   * Get the bit-rate to use, in bits per seconds.
   * This can either be overridden, multiplied, or just left at the recommended value.
   */
  private fun getBitRate(): Int {
    var bitRate = getRecommendedBitRate(fps ?: 30, options.videoCodec, hdr)
    options.videoBitRateOverride?.let { override ->
      // Mbps -> bps
      bitRate = (override * 1_000_000).toInt()
    }
    options.videoBitRateMultiplier?.let { multiplier ->
      // multiply by 1.2, 0.8, ...
      bitRate = (bitRate * multiplier).toInt()
    }
    return bitRate
  }

  private fun getMaxFileSize(): Long {
    val statFs = StatFsHelper.getInstance()
    val availableStorage = statFs.getAvailableStorageSpace(StatFsHelper.StorageType.INTERNAL)
    Log.i(TAG, "Maximum available storage space: ${availableStorage / 1_000} kB")
    return availableStorage
  }

  override fun toString(): String {
    val audio = if (enableAudio) "with audio" else "without audio"
    return "${size.width} x ${size.height} @ $fps FPS ${options.videoCodec} ${options.fileType} " +
      "$orientation ${bitRate / 1_000_000.0} Mbps RecordingSession ($audio)"
  }
}
