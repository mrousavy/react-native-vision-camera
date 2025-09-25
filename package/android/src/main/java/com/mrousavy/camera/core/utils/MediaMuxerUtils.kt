package com.mrousavy.camera.core.utils

import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import java.nio.ByteBuffer

object MediaMuxerUtils {
  fun muxMp4(videoPath: String, audioPath: String, outputPath: String) {
    val videoExtractor = MediaExtractor()
    val audioExtractor = MediaExtractor()
    val muxer = MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)

    try {
      videoExtractor.setDataSource(videoPath)
      audioExtractor.setDataSource(audioPath)

      val videoTrackIndex = selectTrack(videoExtractor, true)
      val audioTrackIndex = selectTrack(audioExtractor, false)

      if (videoTrackIndex < 0) throw IllegalStateException("No video track in $videoPath")
      if (audioTrackIndex < 0) throw IllegalStateException("No audio track in $audioPath")

      videoExtractor.selectTrack(videoTrackIndex)
      audioExtractor.selectTrack(audioTrackIndex)

      val videoFormat = videoExtractor.getTrackFormat(videoTrackIndex)
      val audioFormat = audioExtractor.getTrackFormat(audioTrackIndex)

      val muxVideoIndex = muxer.addTrack(videoFormat)
      val muxAudioIndex = muxer.addTrack(audioFormat)

      muxer.start()

      copyTrack(videoExtractor, muxer, muxVideoIndex)
      copyTrack(audioExtractor, muxer, muxAudioIndex)
    } finally {
      try { muxer.stop() } catch (_: Throwable) {}
      try { muxer.release() } catch (_: Throwable) {}
      try { videoExtractor.release() } catch (_: Throwable) {}
      try { audioExtractor.release() } catch (_: Throwable) {}
    }
  }

  private fun selectTrack(extractor: MediaExtractor, video: Boolean): Int {
    for (i in 0 until extractor.trackCount) {
      val format = extractor.getTrackFormat(i)
      val mime = format.getString(MediaFormat.KEY_MIME) ?: continue
      if (video && mime.startsWith("video/")) return i
      if (!video && mime.startsWith("audio/")) return i
    }
    return -1
  }

  private fun copyTrack(extractor: MediaExtractor, muxer: MediaMuxer, muxTrack: Int) {
    val currentTrack = extractor.sampleTrackIndex.takeIf { it >= 0 } ?: 0
    val format = extractor.getTrackFormat(currentTrack)
    val maxSize = if (format.containsKey(MediaFormat.KEY_MAX_INPUT_SIZE)) format.getInteger(MediaFormat.KEY_MAX_INPUT_SIZE) else 1024 * 1024
    val buffer = ByteBuffer.allocateDirect(maxSize.coerceAtLeast(64 * 1024))
    val info = MediaCodec.BufferInfo()
    var ptsOffset = -1L

    while (true) {
      buffer.clear()
      val sampleSize = extractor.readSampleData(buffer, 0)
      if (sampleSize < 0) break
      info.size = sampleSize
      info.offset = 0
      info.flags = extractor.sampleFlags
      var pts = extractor.sampleTime
      if (ptsOffset < 0 && pts >= 0) ptsOffset = pts
      if (ptsOffset > 0 && pts >= 0) pts -= ptsOffset
      info.presentationTimeUs = if (pts >= 0) pts else 0
      muxer.writeSampleData(muxTrack, buffer, info)
      extractor.advance()
    }
  }
}
