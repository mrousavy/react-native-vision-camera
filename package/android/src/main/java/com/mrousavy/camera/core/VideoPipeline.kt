package com.mrousavy.camera.core

import android.graphics.ImageFormat
import android.media.ImageReader
import android.media.ImageWriter
import android.util.Log
import android.view.Surface
import com.mrousavy.camera.CameraQueues
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.parsers.Orientation
import java.io.Closeable

@Suppress("JoinDeclarationAndAssignment")
class VideoPipeline(val width: Int, val height: Int, val format: Int = ImageFormat.PRIVATE, private val isMirrored: Boolean = false) :
  ImageReader.OnImageAvailableListener,
  Closeable {
  companion object {
    private const val MAX_IMAGES = 3
    private const val TAG = "VideoPipeline"
  }

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
      imageReader.close()
      frameProcessor = null
      recordingSessionImageWriter?.close()
      recordingSessionImageWriter = null
      recordingSession = null
    }
  }

  fun setFrameProcessorOutput(frameProcessor: FrameProcessor?) {
    this.frameProcessor = frameProcessor
  }

  fun setRecordingSessionOutput(recordingSession: RecordingSession?) {
    synchronized(this) {
      this.recordingSessionImageWriter?.close()
      this.recordingSessionImageWriter = null
      this.recordingSession = recordingSession

      if (recordingSession != null) {
        this.recordingSessionImageWriter = ImageWriter.newInstance(recordingSession.surface, MAX_IMAGES)
      }
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
