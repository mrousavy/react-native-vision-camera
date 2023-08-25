package com.mrousavy.camera.utils

import android.graphics.ImageFormat
import android.graphics.SurfaceTexture
import android.media.ImageReader
import android.media.ImageWriter
import android.media.MediaRecorder
import android.util.Log
import android.view.Surface
import com.facebook.jni.HybridData
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.parsers.Orientation
import java.io.Closeable

/**
 * An OpenGL pipeline for streaming Camera Frames to one or more outputs.
 * Currently, [VideoPipeline] can stream to a [FrameProcessor] and a [MediaRecorder].
 *
 * @param [width] The width of the Frames to stream (> 0)
 * @param [height] The height of the Frames to stream (> 0)
 * @param [format] The format of the Frames to stream. ([ImageFormat.PRIVATE], [ImageFormat.YUV_420_888] or [ImageFormat.JPEG])
 */
@Suppress("KotlinJniMissingFunction")
class VideoPipeline(val width: Int,
                    val height: Int,
                    val format: Int = ImageFormat.PRIVATE): SurfaceTexture.OnFrameAvailableListener, Closeable {
  companion object {
    private const val MAX_IMAGES = 5
  }

  private val mHybridData: HybridData

  // Output 1
  private var frameProcessor: FrameProcessor? = null
  private var imageReader: ImageReader? = null

  // Output 2
  private var recordingSession: RecordingSession? = null

  // Input
  private val surfaceTexture: SurfaceTexture
  val surface: Surface

  init {
    mHybridData = initHybrid()
    surfaceTexture = SurfaceTexture(false)
    surfaceTexture.setOnFrameAvailableListener(this)
    surface = Surface(surfaceTexture)
  }

  override fun close() {
    imageReader?.close()
    imageReader = null
    frameProcessor = null
    recordingSession = null
    mHybridData.resetNative()
  }

  override fun onFrameAvailable(surfaceTexture: SurfaceTexture) {
    // TODO: Check if this SurfaceTexture is already attached to our OpenGL context, if not, attach it
    // TODO: Do updateTexImage()
    // TODO: Render the Frame to [recordingSession]
    // TODO: Render the Frame to [ImageWriter] and then call [frameProcessor]
  }

  /**
   * Configures the Pipeline to also call the given [FrameProcessor].
   * * If the [frameProcessor] is `null`, this output channel will be removed.
   * * If the [frameProcessor] is not `null`, the [VideoPipeline] will create Frames
   * using an [ImageWriter] and call the [FrameProcessor] with those Frames.
   */
  fun setFrameProcessorOutput(frameProcessor: FrameProcessor?) {
    this.frameProcessor = frameProcessor

    if (frameProcessor != null) {
      // 1. Close previous ImageReader
      this.imageReader?.close()

      // 2. Create new ImageReader that just calls FrameProcessor whenever an Image is available
      val imageReader = ImageReader.newInstance(width, height, format, MAX_IMAGES)
      imageReader.setOnImageAvailableListener({ reader ->
        Log.i("VideoPipeline", "ImageReader::onImageAvailable!")
        val image = reader.acquireLatestImage()

        // TODO: Get correct orientation and isMirrored
        val frame = Frame(image, image.timestamp, Orientation.PORTRAIT, false)
        frame.incrementRefCount()
        frameProcessor.call(frame)
        frame.decrementRefCount()
      }, null)

      // 3. Configure OpenGL pipeline to stream Frames into the ImageReader's surface
      setFrameProcessorOutputSurface(imageReader.surface)

      this.imageReader = imageReader
      this.frameProcessor = frameProcessor
    } else {
      // 1. Configure OpenGL pipeline to stop streaming Frames into the ImageReader's surface
      setFrameProcessorOutputSurface(null)

      // 2. Close the ImageReader
      this.imageReader?.close()

      this.imageReader = null
      this.frameProcessor = null
    }
  }

  /**
   * Configures the Pipeline to also write Frames to a Surface from a [MediaRecorder].
   * * If the [surface] is `null`, this output channel will be removed.
   * * If the [surface] is not `null`, the [VideoPipeline] will write Frames to this Surface.
   */
  fun setRecordingSessionOutput(recordingSession: RecordingSession?) {
    if (recordingSession != null) {
      // Configure OpenGL pipeline to stream Frames into the Recording Session's surface
      setRecordingSessionOutputSurface(recordingSession.surface, recordingSession.size.width, recordingSession.size.height)
      this.recordingSession = recordingSession
    } else {
      // Configure OpenGL pipeline to stop streaming Frames into the Recording Session's surface
      setRecordingSessionOutputSurface(null, null, null)
      this.recordingSession = null
    }
  }


  private external fun setFrameProcessorOutputSurface(surface: Any?)
  private external fun setRecordingSessionOutputSurface(surface: Any?, width: Int?, height: Int?)
  private external fun initHybrid(): HybridData
}
