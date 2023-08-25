package com.mrousavy.camera.utils

import android.graphics.ImageFormat
import android.graphics.PixelFormat
import android.graphics.SurfaceTexture
import android.media.ImageWriter
import android.media.MediaRecorder
import android.os.Build
import android.view.Surface
import androidx.annotation.RequiresApi
import com.facebook.jni.HybridData
import com.mrousavy.camera.frameprocessor.FrameProcessor
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
@RequiresApi(Build.VERSION_CODES.O)
class VideoPipeline(val width: Int,
                    val height: Int,
                    val format: Int? = null): SurfaceTexture.OnFrameAvailableListener, Closeable {
  private val mHybridData: HybridData

  // Output 1
  private var frameProcessor: FrameProcessor? = null
  private var imageWriter: ImageWriter? = null

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
    imageWriter?.close()
    imageWriter = null
    frameProcessor = null
    recordingSession = null
    // TODO: Destroy OpenGL context here
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
    if (this.frameProcessor == frameProcessor) return

    if (frameProcessor != null) {
      this.imageWriter?.close()

      this.frameProcessor = frameProcessor
      if (format == null) {
        // TODO: Get a Surface from OpenGL here...
        this.imageWriter = ImageWriter.newInstance(null, MAX_IMAGES)
      } else {
        // TODO: Get a Surface from OpenGL here...
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) throw Error("Setting ImageWriter PixelFormat requires API 29 or higher!")
        this.imageWriter = ImageWriter.newInstance(null, MAX_IMAGES, format)
      }
    } else {
      this.imageWriter?.close()
      this.imageWriter = null
      this.frameProcessor = null
    }
  }

  /**
   * Configures the Pipeline to also write Frames to a Surface from a [MediaRecorder].
   * * If the [surface] is `null`, this output channel will be removed.
   * * If the [surface] is not `null`, the [VideoPipeline] will write Frames to this Surface.
   */
  fun setRecordingSessionOutput(recordingSession: RecordingSession?) {
    this.recordingSession = recordingSession
  }


  private external fun initHybrid(): HybridData

  companion object {
    private const val MAX_IMAGES = 5
  }
}
