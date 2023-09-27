package com.mrousavy.camera.core

import android.graphics.ImageFormat
import android.graphics.SurfaceTexture
import android.media.ImageReader
import android.util.Log
import android.view.Surface
import com.facebook.jni.HybridData
import com.mrousavy.camera.CameraQueues
import com.mrousavy.camera.PixelFormatNotSupportedInVideoPipelineError
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.parsers.Orientation
import com.mrousavy.camera.parsers.PixelFormat
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
class VideoPipeline(val width: Int, val height: Int, val format: Int = ImageFormat.PRIVATE, private val isMirrored: Boolean = false) :
  SurfaceTexture.OnFrameAvailableListener,
  Closeable {
  companion object {
    private const val MAX_IMAGES = 3
    private const val TAG = "VideoPipeline"

    init {
      try {
        System.loadLibrary("VisionCamera")
      } catch (e: UnsatisfiedLinkError) {
        Log.e(
          TAG,
          "Failed to load VisionCamera C++ library! " +
            "OpenGL GPU VideoPipeline cannot be used.",
          e
        )
        throw e
      }
    }
  }

  private val mHybridData: HybridData
  private var openGLTextureId: Int? = null
  private var transformMatrix = FloatArray(16)
  private var isActive = true

  private var imageReader: ImageReader
  private var imageWriter: ImageWriter

  // Output 1
  private var frameProcessor: FrameProcessor? = null

  // Output 2
  private var recordingSession: RecordingSession? = null

  // Input
  private val surfaceTexture: SurfaceTexture
  val surface: Surface

  init {
    Log.i(
      TAG,
      "Initializing $width x $height Video Pipeline " +
        "(format: ${PixelFormat.fromImageFormat(format)} #$format)"
    )
    // TODO: We currently use OpenGL for the Video Pipeline.
    //  OpenGL only works in the RGB (RGBA_8888; 0x23) pixel-format, so we cannot
    //  override the pixel-format to something like YUV or PRIVATE.
    //  This absolutely sucks and I would prefer to replace the OpenGL pipeline with
    //  something similar to how iOS works where we just pass GPU buffers around,
    //  but android.media APIs are just not as advanced yet.
    //  For example, ImageReader/ImageWriter is way too buggy and does not work with MediaRecorder.
    //  See this issue ($4.000 bounty!) for more details:
    //  https://github.com/mrousavy/react-native-vision-camera/issues/1837
    if (format != ImageFormat.PRIVATE && format != 0x23) {
      throw PixelFormatNotSupportedInVideoPipelineError(PixelFormat.fromImageFormat(format).unionValue)
    }
    mHybridData = initHybrid(width, height)
    surfaceTexture = SurfaceTexture(false)
    surfaceTexture.setDefaultBufferSize(width, height)
    surfaceTexture.setOnFrameAvailableListener(this)
    val glSurface = Surface(surfaceTexture)

    imageWriter = ImageWriter.newInstance(glSurface, MAX_IMAGES)
    imageReader = ImageReader.newInstance(width, height, format, MAX_IMAGES)
    imageReader.setOnImageAvailableListener({ reader ->
      Log.i("VideoPipeline", "ImageReader::onImageAvailable!")
      val image = reader.acquireNextImage() ?: return@setOnImageAvailableListener

      // // TODO: Get correct orientation and isMirrored
      // val frame = Frame(image, image.timestamp, Orientation.PORTRAIT, isMirrored)
      // frame.incrementRefCount()
      // frameProcessor?.call(frame)

      imageWriter.queueInputImage(image)

      // frame.decrementRefCount()
    }, CameraQueues.videoQueue.handler)

    surface = imageReader.surface
  }

  override fun close() {
    synchronized(this) {
      isActive = false
      imageWriter.close()
      imageReader.close()
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

  /**
   * Configures the Pipeline to also call the given [FrameProcessor] (or null).
   */
  fun setFrameProcessorOutput(frameProcessor: FrameProcessor?) {
    synchronized(this) {
      Log.i(TAG, "Setting $width x $height FrameProcessor Output...")
      this.frameProcessor = frameProcessor
    }
  }

  /**
   * Configures the Pipeline to also write Frames to a Surface from a [MediaRecorder] (or null)
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
  private external fun setRecordingSessionOutputSurface(surface: Any)
  private external fun removeRecordingSessionOutputSurface()
  private external fun initHybrid(width: Int, height: Int): HybridData
}
