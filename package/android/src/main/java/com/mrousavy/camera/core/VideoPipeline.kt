package com.mrousavy.camera.core

import android.graphics.ImageFormat
import android.graphics.SurfaceTexture
import android.hardware.HardwareBuffer
import android.media.ImageReader
import android.media.ImageWriter
import android.os.Build
import android.util.Log
import android.view.Surface
import androidx.annotation.Keep
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.frameprocessor.FrameProcessor
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.PixelFormat
import java.io.Closeable

/**
 * An OpenGL pipeline for streaming Camera Frames to one or more outputs.
 * Currently, [VideoPipeline] can stream to a [FrameProcessor] and a [RecordingSession].
 *
 * @param [width] The width of the Frames to stream (> 0)
 * @param [height] The height of the Frames to stream (> 0)
 * @param [format] The format of the Frames to stream. ([ImageFormat.PRIVATE], [ImageFormat.YUV_420_888] or [ImageFormat.JPEG])
 */
@Suppress("KotlinJniMissingFunction")
class VideoPipeline(
  val width: Int,
  val height: Int,
  val format: PixelFormat = PixelFormat.NATIVE,
  private val isMirrored: Boolean = false,
  enableFrameProcessor: Boolean = false
) : SurfaceTexture.OnFrameAvailableListener,
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

  @DoNotStrip
  @Keep
  private val mHybridData: HybridData
  private var openGLTextureId: Int? = null
  private var transformMatrix = FloatArray(16)
  private var isActive = true

  // Output 1
  private var frameProcessor: FrameProcessor? = null

  // Output 2
  private var recordingSession: RecordingSession? = null

  // Input
  private val surfaceTexture: SurfaceTexture
  val surface: Surface

  // If Frame Processors are enabled, we go through ImageReader first before we go thru OpenGL
  private var imageReader: ImageReader? = null
  private var imageWriter: ImageWriter? = null

  private val hasOutputs: Boolean
    get() = recordingSession != null

  init {
    Log.i(
      TAG,
      "Initializing $width x $height Video Pipeline (format: $format)"
    )
    mHybridData = initHybrid(width, height)
    surfaceTexture = SurfaceTexture(false)
    surfaceTexture.setDefaultBufferSize(width, height)
    surfaceTexture.setOnFrameAvailableListener(this)
    val glSurface = Surface(surfaceTexture)

    if (enableFrameProcessor) {
      // User has passed a Frame Processor, we need to route images through ImageReader so we can get
      // CPU access to the Frames, then send them to the OpenGL pipeline later.
      val format = getImageReaderFormat()
      Log.i(TAG, "Using ImageReader round-trip (format: #$format)")

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        Log.i(TAG, "Using API 29 for GPU ImageReader...")
        // If we are in PRIVATE, we just pass it to the GPU as efficiently as possible - so use GPU flag.
        // If we are in YUV/RGB/..., we probably want to access Frame data - so use CPU flag.
        val usage = if (format == ImageFormat.PRIVATE) HardwareBuffer.USAGE_GPU_SAMPLED_IMAGE else HardwareBuffer.USAGE_CPU_READ_OFTEN
        imageReader = ImageReader.newInstance(width, height, format, MAX_IMAGES, usage)
        imageWriter = ImageWriter.newInstance(glSurface, MAX_IMAGES, format)
      } else {
        Log.i(TAG, "Using legacy API for CPU ImageReader...")
        imageReader = ImageReader.newInstance(width, height, format, MAX_IMAGES)
        imageWriter = ImageWriter.newInstance(glSurface, MAX_IMAGES)
      }
      imageReader!!.setOnImageAvailableListener({ reader ->
        Log.i(TAG, "ImageReader::onImageAvailable!")
        val image = reader.acquireNextImage() ?: return@setOnImageAvailableListener

        try {
          // TODO: Get correct orientation and isMirrored
          val frame = Frame(image, image.timestamp, Orientation.PORTRAIT, isMirrored)
          frame.incrementRefCount()
          frameProcessor?.call(frame)

          if (hasOutputs) {
            // If we have outputs (e.g. a RecordingSession), pass the frame along to the OpenGL pipeline
            imageWriter!!.queueInputImage(image)
          }

          frame.decrementRefCount()
        } catch (e: Throwable) {
          Log.e(TAG, "Failed to call Frame Processor!", e)
        }
      }, CameraQueues.videoQueue.handler)

      surface = imageReader!!.surface
    } else {
      // No Frame Processor will be used, directly render into the OpenGL pipeline to avoid ImageReader roundtrip.
      surface = glSurface
    }
  }

  override fun close() {
    synchronized(this) {
      isActive = false
      imageWriter?.close()
      imageReader?.close()
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

  private fun getImageReaderFormat(): Int =
    when (format) {
      PixelFormat.NATIVE -> ImageFormat.PRIVATE
      PixelFormat.RGB -> HardwareBuffer.RGBA_8888
      PixelFormat.YUV -> ImageFormat.YUV_420_888
      else -> ImageFormat.PRIVATE
    }

  /**
   * Configures the Pipeline to also call the given [FrameProcessor] (or null).
   */
  fun setFrameProcessorOutput(frameProcessor: FrameProcessor?) {
    synchronized(this) {
      if (frameProcessor != null) {
        Log.i(TAG, "Setting $width x $height FrameProcessor Output...")
      } else {
        Log.i(TAG, "Removing FrameProcessor Output...")
      }
      this.frameProcessor = frameProcessor
    }
  }

  /**
   * Configures the Pipeline to also write Frames to a Surface from a `MediaRecorder` (or null)
   */
  fun setRecordingSessionOutput(recordingSession: RecordingSession?) {
    synchronized(this) {
      if (recordingSession != null) {
        // Configure OpenGL pipeline to stream Frames into the Recording Session's surface
        Log.i(TAG, "Setting $width x $height RecordingSession Output...")
        setRecordingSessionOutputSurface(recordingSession.surface)
        this.recordingSession = recordingSession
      } else {
        // Configure OpenGL pipeline to stop streaming Frames into the Recording Session's surface
        Log.i(TAG, "Removing RecordingSession Output...")
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
