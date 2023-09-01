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
    private const val TAG = "VideoPipeline"
  }

  private val mHybridData: HybridData
  private var openGLTextureId: Int? = null
  private var transformMatrix = FloatArray(16)
  private var isActive = true

  // Output 1
  private var frameProcessor: FrameProcessor? = null
  private var imageReader: ImageReader? = null

  // Output 2
  private var recordingSession: RecordingSession? = null

  // Input
  private val surfaceTexture: SurfaceTexture
  val surface: Surface

  init {
    mHybridData = initHybrid(width, height)
    surfaceTexture = SurfaceTexture(false)
    surfaceTexture.setDefaultBufferSize(width, height)
    surfaceTexture.setOnFrameAvailableListener(this)
    surface = Surface(surfaceTexture)
  }

  override fun close() {
    synchronized(this) {
      isActive = false
      imageReader?.close()
      imageReader = null
      frameProcessor = null
      recordingSession = null
      surfaceTexture.release()
      mHybridData.resetNative()
    }
  }

  override fun onFrameAvailable(surfaceTexture: SurfaceTexture) {
    synchronized(this) {
      if (!isActive) return@synchronized

      // 1. Attach Surface to OpenGL context
      if (openGLTextureId == null) {
        openGLTextureId = getInputTextureId()
        surfaceTexture.attachToGLContext(openGLTextureId!!)
        Log.i(TAG, "Attached Texture to Context $openGLTextureId")
      }

      // 2. Prepare the OpenGL context (eglMakeCurrent)
      onBeforeFrame()

      // 3. Update the OpenGL texture
      surfaceTexture.updateTexImage()

      // 4. Get the transform matrix from the SurfaceTexture (rotations/scales applied by Camera)
      surfaceTexture.getTransformMatrix(transformMatrix)

      // 5. Draw it with applied rotation/mirroring
      onFrame(transformMatrix)
    }
  }

  private fun getImageReader(): ImageReader {
    val imageReader = ImageReader.newInstance(width, height, format, MAX_IMAGES)
    imageReader.setOnImageAvailableListener({ reader ->
      Log.i("VideoPipeline", "ImageReader::onImageAvailable!")
      val image = reader.acquireLatestImage() ?: return@setOnImageAvailableListener

      // TODO: Get correct orientation and isMirrored
      val frame = Frame(image, image.timestamp, Orientation.PORTRAIT, false)
      frame.incrementRefCount()
      frameProcessor?.call(frame)
      frame.decrementRefCount()
    }, null)
    return imageReader
  }

  /**
   * Configures the Pipeline to also call the given [FrameProcessor].
   * * If the [frameProcessor] is `null`, this output channel will be removed.
   * * If the [frameProcessor] is not `null`, the [VideoPipeline] will create Frames
   * using an [ImageWriter] and call the [FrameProcessor] with those Frames.
   */
  fun setFrameProcessorOutput(frameProcessor: FrameProcessor?) {
    synchronized(this) {
      Log.i(TAG, "Setting $width x $height FrameProcessor Output...")
      this.frameProcessor = frameProcessor

      if (frameProcessor != null) {
        if (this.imageReader == null) {
          // 1. Create new ImageReader that just calls the Frame Processor
          this.imageReader = getImageReader()
        }

        // 2. Configure OpenGL pipeline to stream Frames into the ImageReader's surface
        setFrameProcessorOutputSurface(imageReader!!.surface)
      } else {
        // 1. Configure OpenGL pipeline to stop streaming Frames into the ImageReader's surface
        removeFrameProcessorOutputSurface()

        // 2. Close the ImageReader
        this.imageReader?.close()
        this.imageReader = null
      }
    }
  }

  /**
   * Configures the Pipeline to also write Frames to a Surface from a [MediaRecorder].
   * * If the [surface] is `null`, this output channel will be removed.
   * * If the [surface] is not `null`, the [VideoPipeline] will write Frames to this Surface.
   */
  fun setRecordingSessionOutput(recordingSession: RecordingSession?) {
    synchronized(this) {
      Log.i(TAG, "Setting $width x $height RecordingSession Output...")
      if (recordingSession != null) {
        // Configure OpenGL pipeline to stream Frames into the Recording Session's surface
        setRecordingSessionOutputSurface(recordingSession.surface)
        this.recordingSession = recordingSession
      } else {
        // Configure OpenGL pipeline to stop streaming Frames into the Recording Session's surface
        removeRecordingSessionOutputSurface()
        this.recordingSession = null
      }
    }
  }

  private external fun getInputTextureId(): Int
  private external fun onBeforeFrame()
  private external fun onFrame(transformMatrix: FloatArray)
  private external fun setFrameProcessorOutputSurface(surface: Any)
  private external fun removeFrameProcessorOutputSurface()
  private external fun setRecordingSessionOutputSurface(surface: Any)
  private external fun removeRecordingSessionOutputSurface()
  private external fun initHybrid(width: Int, height: Int): HybridData
}
