package com.mrousavy.camera.core

import android.graphics.ImageFormat
import android.media.ImageReader
import android.media.ImageWriter
import android.media.MediaRecorder
import android.util.Log
import android.view.Surface
import com.mrousavy.camera.CameraQueues
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.parsers.Orientation
import java.io.Closeable

/**
 * A pipeline for streaming Camera Frames to one or more outputs powered by ImageWriter.
 * Currently, [VideoPipeline] can stream to a [FrameProcessor] and a [MediaRecorder].
 *
 * @param [width] The width of the Frames to stream (> 0)
 * @param [height] The height of the Frames to stream (> 0)
 * @param [format] The format of the Frames to stream. ([ImageFormat.PRIVATE], [ImageFormat.YUV_420_888] or [ImageFormat.JPEG])
 */
@Suppress("JoinDeclarationAndAssignment")
class VideoPipeline(val width: Int,
                    val height: Int,
                    val format: Int = ImageFormat.PRIVATE,
                    private val isMirrored: Boolean = false): ImageReader.OnImageAvailableListener, Closeable {
  companion object {
    private const val MAX_IMAGES = 3
    private const val TAG = "VideoPipeline"
  }

  private var isActive = true

  // Output 1
  private var frameProcessor: FrameProcessor? = null

  // Output 2
  private var recordingSession: RecordingSession? = null
  private var recordingSessionImageWriter: ImageWriter? = null

  // Input
  private val imageReader: ImageReader
  val surface: Surface

  init {
    imageReader = ImageReader.newInstance(width, height, format, MAX_IMAGES)
    imageReader.setOnImageAvailableListener(this, CameraQueues.videoQueue.handler)
    surface = imageReader.surface
  }

  override fun close() {
    synchronized(this) {
      isActive = false
      imageReader.close()
      frameProcessor = null
      recordingSessionImageWriter?.close()
      recordingSessionImageWriter = null
      recordingSession = null
    }
  }

  /**
   * Configures the Pipeline to also call the given [FrameProcessor] (or null).
   */
  fun setFrameProcessorOutput(frameProcessor: FrameProcessor?) {
    this.frameProcessor = frameProcessor
  }

  /**
   * Configures the Pipeline to also write Frames to a Surface from a [MediaRecorder] (or null)
   */
  fun setRecordingSessionOutput(recordingSession: RecordingSession?) {
    this.recordingSessionImageWriter?.close()

    if (recordingSession != null) {
      this.recordingSession = recordingSession
      this.recordingSessionImageWriter = ImageWriter.newInstance(recordingSession.surface, MAX_IMAGES)
    } else {
      this.recordingSessionImageWriter = null
      this.recordingSession = null
    }
  }

  override fun onImageAvailable(reader: ImageReader) {
    val image = reader.acquireLatestImage()
    if (image == null) {
      Log.w(TAG, "ImageReader failed to acquire a new image!")
      return
    }

    // If we have a Frame Processor, call it
    frameProcessor?.let { fp ->
      val frame = Frame(image, image.timestamp, Orientation.PORTRAIT, isMirrored)
      frame.incrementRefCount()
      fp.call(frame)
      frame.decrementRefCount()
    }

    // If we have a RecordingSession, pass the image through
    recordingSessionImageWriter?.queueInputImage(image)
  }
}
