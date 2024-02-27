package com.mrousavy.camera.core

import android.annotation.SuppressLint
import android.graphics.ImageFormat
import android.graphics.SurfaceTexture
import android.hardware.HardwareBuffer
import android.media.Image
import android.media.ImageReader
import android.media.ImageWriter
import android.os.Build
import android.util.Log
import android.util.Range
import android.util.Size
import android.view.Surface
import androidx.annotation.Keep
import androidx.annotation.OptIn
import androidx.annotation.RequiresApi
import androidx.camera.core.CameraInfo
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageAnalysis.Analyzer
import androidx.camera.core.ImageProxy
import androidx.camera.core.SurfaceRequest
import androidx.camera.core.impl.ConstantObservable
import androidx.camera.core.impl.Observable
import androidx.camera.core.processing.OpenGlRenderer
import androidx.camera.video.MediaSpec
import androidx.camera.video.Quality
import androidx.camera.video.QualitySelector
import androidx.camera.video.VideoCapabilities
import androidx.camera.video.VideoOutput
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
 * @param [format] The format of the Frames to stream. ([ImageFormat.PRIVATE], [ImageFormat.YUV_420_888] or [ImageFormat.JPEG])
 */
@Suppress("KotlinJniMissingFunction")
class VideoPipeline(
  val format: PixelFormat = PixelFormat.NATIVE,
  private val isMirrored: Boolean = false,
  private val enableFrameProcessor: Boolean = false,
  private val enableGpuBuffers: Boolean = false,
  private val callback: CameraSession.Callback
) : Analyzer, Closeable {
  companion object {
    private const val MAX_IMAGES = 3
    private const val TAG = "VideoPipeline"
  }
  data class OpenGLState(val surfaceTexture: SurfaceTexture, val surface: Surface, val size: Size): Closeable {
    override fun close() {
      surface.release()
      surfaceTexture.release()
    }
  }
  data class ImageWriterState(val imageWriter: ImageWriter, val size: Size, val format: Int)

  @DoNotStrip
  @Keep
  private val mHybridData: HybridData
  private var openGlState: OpenGLState? = null
  private var imageWriterState: ImageWriterState? = null
  private var isActive = true

  // Output
  // TODO: Recording Session output?

  init {
    Log.i(TAG, "Initializing VideoPipeline (Format: $format, Frame Processors: $enableFrameProcessor, GPU Buffers: $enableGpuBuffers)")
    mHybridData = initHybrid()
  }

  @OptIn(ExperimentalGetImage::class)
  override fun analyze(imageProxy: ImageProxy) {
    val image = imageProxy.image ?: throw InvalidImageTypeError()

    // TODO: get is mirrored
    val isMirrored = false
    val frame = Frame(image, imageProxy.imageInfo.timestamp, Orientation.fromRotationDegrees(imageProxy.imageInfo.rotationDegrees), isMirrored)
    frame.incrementRefCount()
    try {
      // 1. Call Frame Processor
      callback.onFrame(frame)

      // 2. Forward to OpenGL pipeline
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val imageWriterState = getOrCreateImageWriter(imageProxy)
        imageWriterState.imageWriter.queueInputImage(image)
      } else {
        throw Error("VideoPipeline with Frame Processors requires API 26 or above!")
      }
    } catch (e: Throwable) {
      Log.e(TAG, "VideoPipeline threw an error! ${e.message}", e)
      callback.onError(e)
    } finally {
        frame.decrementRefCount()
    }
  }

  private fun getOrCreateImageWriter(image: ImageProxy): ImageWriterState {
    val size = Size(image.width, image.height)
    val format = image.format
    val currentWriter = imageWriterState
    if (currentWriter != null && currentWriter.size == size && currentWriter.format == format) {
      return currentWriter
    }

    val openGlState = getOrCreateGLState(size)

    Log.i(TAG, "Initializing new $size ImageWriter in format $format...")
    val imageWriter = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      Log.i(TAG, "Creating $size ImageWriter with format $format...")
      ImageWriter.newInstance(openGlState.surface, MAX_IMAGES, format)
    } else {
      Log.i(TAG, "Creating $size ImageWriter with default format...")
      ImageWriter.newInstance(openGlState.surface, MAX_IMAGES)
    }
    val state = ImageWriterState(imageWriter, size, format)
    imageWriterState = state
    return state
  }

  private fun getOrCreateGLState(size: Size): OpenGLState {
    val currentState = openGlState
    if (currentState != null && currentState.size == size) {
      return currentState
    }

    Log.i(TAG, "Creating $size OpenGL texture...")
    val surfaceTexture = SurfaceTexture(false)
    surfaceTexture.setDefaultBufferSize(size.width, size.height)

    var openGLTextureId: Int? = null
    val transformMatrix = FloatArray(16)
    surfaceTexture.setOnFrameAvailableListener { texture ->
      synchronized(this) {
        if (!isActive) return@synchronized

        // 1. Attach Surface to OpenGL context
        if (openGLTextureId == null) {
          openGLTextureId = createInputTexture(size.width, size.height)
          texture.attachToGLContext(openGLTextureId!!)
          Log.i(TAG, "Attached Texture to Context $openGLTextureId")
        }

        // 2. Prepare the OpenGL context (eglMakeCurrent)
        onBeforeFrame()

        // 3. Update the OpenGL texture
        texture.updateTexImage()

        // 4. Get the transform matrix from the SurfaceTexture (rotations/scales applied by Camera)
        texture.getTransformMatrix(transformMatrix)

        // 5. Draw it with applied rotation/mirroring
        onFrame(transformMatrix)
      }
    }
    val surface = Surface(surfaceTexture)

    val state = OpenGLState(surfaceTexture, surface, size)
    openGlState = state
    return state
  }

  override fun close() {
    synchronized(this) {
      isActive = false
      removeRecordingSessionOutputSurface()
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
   * Get the recommended HardwareBuffer flags for creating ImageReader instances with.
   *
   * Tries to use [HardwareBuffer.USAGE_GPU_SAMPLED_IMAGE] if possible, [HardwareBuffer.USAGE_CPU_READ_OFTEN]
   * or a combination of both flags if CPU access is needed ([enableFrameProcessor]), and [0] otherwise.
   */
  @RequiresApi(Build.VERSION_CODES.Q)
  @Suppress("LiftReturnOrAssignment")
  private fun getRecommendedHardwareBufferFlags(width: Int, height: Int): Long {
    val cpuFlag = HardwareBuffer.USAGE_CPU_READ_OFTEN
    val gpuFlag = HardwareBuffer.USAGE_GPU_SAMPLED_IMAGE
    val bothFlags = gpuFlag or cpuFlag

    if (format == PixelFormat.NATIVE) {
      // We don't need CPU access, so we can use GPU optimized buffers
      if (supportsHardwareBufferFlags(width, height, gpuFlag)) {
        // We support GPU Buffers directly and
        Log.i(TAG, "GPU HardwareBuffers are supported!")
        return gpuFlag
      } else {
        // no flags are supported - fall back to default
        return 0
      }
    } else {
      // We are using YUV or RGB formats, so we need CPU access on the Frame
      if (supportsHardwareBufferFlags(width, height, bothFlags)) {
        // We support both CPU and GPU flags!
        Log.i(TAG, "GPU + CPU HardwareBuffers are supported!")
        return bothFlags
      } else if (supportsHardwareBufferFlags(width, height, cpuFlag)) {
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
  private fun supportsHardwareBufferFlags(width: Int, height: Int, flags: Long): Boolean {
    val hardwareBufferFormat = format.toHardwareBufferFormat()
    try {
      return HardwareBuffer.isSupported(width, height, hardwareBufferFormat, 1, flags)
    } catch (_: Throwable) {
      return false
    }
  }

  private external fun createInputTexture(width: Int, height: Int): Int
  private external fun onBeforeFrame()
  private external fun onFrame(transformMatrix: FloatArray)
  private external fun renderHardwareBuffer(hardwareBufferBoxed: Any)
  private external fun setRecordingSessionOutputSurface(surface: Any)
  private external fun removeRecordingSessionOutputSurface()
  private external fun initHybrid(): HybridData
}
