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
import androidx.annotation.RequiresApi
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
  private val enableFrameProcessor: Boolean = false,
  enableGpuBuffers: Boolean = false,
  private val callback: CameraSession.Callback
) : SurfaceTexture.OnFrameAvailableListener,
  Closeable {
  companion object {
    private const val MAX_IMAGES = 3
    private const val TAG = "VideoPipeline"
  }

  @DoNotStrip
  @Keep
  private val mHybridData: HybridData
  private var openGLTextureId: Int? = null
  private var transformMatrix = FloatArray(16)
  private var isActive = true

  // Input
  private val surfaceTexture: SurfaceTexture
  val surface: Surface

  // Output
  private var recordingSession: RecordingSession? = null

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

      // Create ImageReader
      if (enableGpuBuffers && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val usageFlags = getRecommendedHardwareBufferFlags()
        Log.i(TAG, "Creating ImageReader with GPU-optimized usage flags: $usageFlags")
        imageReader = ImageReader.newInstance(width, height, format, MAX_IMAGES, usageFlags)
      } else {
        Log.i(TAG, "Creating ImageReader with default usage flags...")
        imageReader = ImageReader.newInstance(width, height, format, MAX_IMAGES)
      }

      // Create ImageWriter
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        Log.i(TAG, "Creating ImageWriter with format #$format...")
        imageWriter = ImageWriter.newInstance(glSurface, MAX_IMAGES, format)
      } else {
        Log.i(TAG, "Creating ImageWriter with default format...")
        imageWriter = ImageWriter.newInstance(glSurface, MAX_IMAGES)
      }

      imageReader!!.setOnImageAvailableListener({ reader ->
        Log.i(TAG, "ImageReader::onImageAvailable!")
        val image = reader.acquireNextImage() ?: return@setOnImageAvailableListener

        // TODO: Get correct orientation and isMirrored
        val frame = Frame(image, image.timestamp, Orientation.PORTRAIT, isMirrored)
        frame.incrementRefCount()

        try {
          callback.onFrame(frame)

          if (hasOutputs) {
            // If we have outputs (e.g. a RecordingSession), pass the frame along to the OpenGL pipeline
            imageWriter?.queueInputImage(image)
          }
        } catch (e: Throwable) {
          Log.e(TAG, "FrameProcessor/ImageReader pipeline threw an error!", e)
          callback.onError(e)
        } finally {
          frame.decrementRefCount()
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
      removeRecordingSessionOutputSurface()
      recordingSession = null
      surfaceTexture.setOnFrameAvailableListener(null, null)
      surfaceTexture.release()
      surface.release()
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
   * Configures the Pipeline to also write Frames to a Surface from a `MediaRecorder` (or null)
   */
  fun setRecordingSessionOutput(recordingSession: RecordingSession?) {
    synchronized(this) {
      if (recordingSession != null) {
        // Configure OpenGL pipeline to stream Frames into the Recording Session's surface
        Log.i(TAG, "Setting ${recordingSession.size} RecordingSession Output...")
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

  /**
   * Get the recommended HardwareBuffer flags for creating ImageReader instances with.
   *
   * Tries to use [HardwareBuffer.USAGE_GPU_SAMPLED_IMAGE] if possible, [HardwareBuffer.USAGE_CPU_READ_OFTEN]
   * or a combination of both flags if CPU access is needed ([enableFrameProcessor]), and [0] otherwise.
   */
  @RequiresApi(Build.VERSION_CODES.Q)
  @Suppress("LiftReturnOrAssignment")
  private fun getRecommendedHardwareBufferFlags(): Long {
    val cpuFlag = HardwareBuffer.USAGE_CPU_READ_OFTEN
    val gpuFlag = HardwareBuffer.USAGE_GPU_SAMPLED_IMAGE
    val bothFlags = gpuFlag or cpuFlag

    if (format == PixelFormat.NATIVE) {
      // We don't need CPU access, so we can use GPU optimized buffers
      if (supportsHardwareBufferFlags(gpuFlag)) {
        // We support GPU Buffers directly and
        Log.i(TAG, "GPU HardwareBuffers are supported!")
        return gpuFlag
      } else {
        // no flags are supported - fall back to default
        return 0
      }
    } else {
      // We are using YUV or RGB formats, so we need CPU access on the Frame
      if (supportsHardwareBufferFlags(bothFlags)) {
        // We support both CPU and GPU flags!
        Log.i(TAG, "GPU + CPU HardwareBuffers are supported!")
        return bothFlags
      } else if (supportsHardwareBufferFlags(cpuFlag)) {
        // We only support a CPU read flag, that's fine
        Log.i(TAG, "CPU HardwareBuffers are supported!")
        return cpuFlag
      } else {
        // no flags are supported - fall back to default
        return 0
      }
    }
  }

  @RequiresApi(Build.VERSION_CODES.Q)
  private fun supportsHardwareBufferFlags(flags: Long): Boolean {
    val hardwareBufferFormat = format.toHardwareBufferFormat()
    try {
      return HardwareBuffer.isSupported(width, height, hardwareBufferFormat, 1, flags)
    } catch (_: Throwable) {
      return false
    }
  }

  private external fun getInputTextureId(): Int
  private external fun onBeforeFrame()
  private external fun onFrame(transformMatrix: FloatArray)
  private external fun setRecordingSessionOutputSurface(surface: Any)
  private external fun removeRecordingSessionOutputSurface()
  private external fun initHybrid(width: Int, height: Int): HybridData
}
