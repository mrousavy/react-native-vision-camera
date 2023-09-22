package com.mrousavy.camera.core

import android.graphics.ImageFormat
import android.hardware.HardwareBuffer
import android.media.Image
import android.media.ImageReader
import android.media.ImageWriter
import android.os.Build
import android.util.Log
import android.view.Surface
import com.mrousavy.camera.CameraQueues
import com.mrousavy.camera.PixelFormatNotSupportedError
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.parsers.PixelFormat
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
    Log.i(TAG, "Initializing $width x $height Video Pipeline (Format: $format)")
    val flags = HardwareBuffer.USAGE_VIDEO_ENCODE or HardwareBuffer.USAGE_GPU_SAMPLED_IMAGE
    imageReader = ImageReader.newInstance(width, height, format, MAX_IMAGES, flags)
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
    }
  }

  override fun onImageAvailable(reader: ImageReader) {
    val image: Image?
    try {
      image = reader.acquireNextImage()
      if (image == null) {
        Log.w(TAG, "ImageReader failed to acquire a new image!")
        return
      }
    } catch (e: IllegalStateException) {
      Log.w(TAG, "Failed to acquire a new Image, previous calls might be taking too long! Dropping a Frame..")
      return
    }

    // If we have a RecordingSession, pass the image through
    synchronized(this) {
      if (recordingSession != null) {
        if (recordingSessionImageWriter == null) {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // API 29+: We support format
            recordingSessionImageWriter = ImageWriter.newInstance(recordingSession!!.surface, MAX_IMAGES, format)
          } else {
            // API <29: We don't support format
            if (format == ImageFormat.PRIVATE) {
              recordingSessionImageWriter = ImageWriter.newInstance(recordingSession!!.surface, MAX_IMAGES)
            } else {
              throw PixelFormatNotSupportedError(PixelFormat.fromImageFormat(format).unionValue)
            }
          }
          recordingSessionImageWriter!!.setOnImageReleasedListener({
            Log.i(TAG, "ImageWriter: Image consumed by MediaCodec!")
          }, CameraQueues.videoQueue.handler)
        }
        recordingSessionImageWriter!!.queueInputImage(image)
      } else {
        image.close()
      }
    }
  }
}
