package com.mrousavy.camera.core

import android.annotation.SuppressLint
import android.graphics.ImageFormat
import android.graphics.SurfaceTexture
import android.hardware.HardwareBuffer
import android.media.ImageReader
import android.os.Build
import android.util.Log
import android.util.Range
import android.view.Surface
import androidx.annotation.Keep
import androidx.annotation.RequiresApi
import androidx.camera.core.CameraInfo
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
@RequiresApi(Build.VERSION_CODES.O)
@Suppress("KotlinJniMissingFunction")
class VideoPipeline(
  val format: PixelFormat = PixelFormat.NATIVE,
  private val isMirrored: Boolean = false,
  private val enableFrameProcessor: Boolean = false,
  private val enableGpuBuffers: Boolean = false,
  private val callback: CameraSession.Callback
) : VideoOutput,
  Closeable {
  companion object {
    private const val MAX_IMAGES = 3
    private const val TAG = "VideoPipeline"
  }

  @DoNotStrip
  @Keep
  private val mHybridData: HybridData

  // Output
  // TODO: Recording Session output?

  init {
    Log.i(TAG, "Initializing VideoPipeline (Format: $format, Frame Processors: $enableFrameProcessor, GPU Buffers: $enableGpuBuffers)")
    mHybridData = initHybrid()
  }

  @SuppressLint("RestrictedApi")
  override fun getMediaSpec(): Observable<MediaSpec> {
    val mediaSpec = MediaSpec.builder().setOutputFormat(MediaSpec.OUTPUT_FORMAT_MPEG_4).configureVideo { video ->
      video.setFrameRate(Range(0, 60))
      video.setQualitySelector(QualitySelector.from(Quality.HD))
    }
    return ConstantObservable.withValue(mediaSpec.build())
  }

  @SuppressLint("RestrictedApi")
  override fun onSurfaceRequested(request: SurfaceRequest) {
    val size = request.resolution
    val surfaceSpec = request.deferrableSurface
    Log.i(TAG, "Creating $size Surface... (${request.expectedFrameRate.upper} FPS, expected format: ${surfaceSpec.prescribedStreamFormat}, ${request.dynamicRange})")

    if (enableFrameProcessor) {
      // User has passed a Frame Processor, we need to route images through ImageReader so we can get
      // CPU access to the Frames, then send them to the OpenGL pipeline using the underlying HardwareBuffer.
      val format = getImageReaderFormat()
      Log.i(TAG, "Using ImageReader/HardwareBuffer round-trip (format: #$format)")

      // Create ImageReader
      val imageReader = if (enableGpuBuffers && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val usageFlags = getRecommendedHardwareBufferFlags(size.width, size.height)
        Log.i(TAG, "Creating ImageReader with GPU-optimized usage flags: $usageFlags")
        ImageReader.newInstance(size.width, size.height, format, MAX_IMAGES, usageFlags)
      } else {
        Log.i(TAG, "Creating ImageReader with default usage flags...")
        ImageReader.newInstance(size.width, size.height, format, MAX_IMAGES)
      }

      imageReader.setOnImageAvailableListener({ reader ->
        Log.i(TAG, "ImageReader::onImageAvailable!")

        try {
          val image = reader.acquireNextImage() ?: return@setOnImageAvailableListener

          // TODO: Get correct orientation and isMirrored
          val frame = Frame(image, image.timestamp, Orientation.PORTRAIT, isMirrored)
          frame.incrementRefCount()

          try {
            callback.onFrame(frame)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
              val hardwareBuffer = image.hardwareBuffer ?: throw HardwareBuffersNotAvailableError()
              renderHardwareBuffer(hardwareBuffer)
            }
          } finally {
            frame.decrementRefCount()
          }
        } catch (e: Throwable) {
          Log.e(TAG, "FrameProcessor/ImageReader pipeline threw an error!", e)
          callback.onError(e)
        }
      }, CameraQueues.videoQueue.handler)

      request.provideSurface(imageReader.surface, CameraQueues.videoQueue.executor) { result ->
        synchronized(this) {
          imageReader.close()
        }

        onSurfaceClosed(result.resultCode)
      }
    } else {
      // User did not pass a Frame Processor, we can just stream into the OpenGL surface directly.

      val surfaceTexture = SurfaceTexture(false)
      surfaceTexture.setDefaultBufferSize(size.width, size.height)
      val glSurface = Surface(surfaceTexture)

      var openGLTextureId: Int? = null
      val transformMatrix = FloatArray(16)
      var isActive = true
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

      request.provideSurface(glSurface, CameraQueues.videoQueue.executor) { result ->
        synchronized(this) {
          isActive = false
          glSurface.release()
          surfaceTexture.release()
        }

        onSurfaceClosed(result.resultCode)
      }
    }
  }

  private fun onSurfaceClosed(resultCode: Int) {
    when (resultCode) {
      SurfaceRequest.Result.RESULT_INVALID_SURFACE -> throw Error("Invalid Surface!")
      SurfaceRequest.Result.RESULT_REQUEST_CANCELLED -> throw Error("SurfaceRequest was canceled!")
      SurfaceRequest.Result.RESULT_SURFACE_ALREADY_PROVIDED -> Log.i(TAG, "VideoPipeline surface was already provided.")
      SurfaceRequest.Result.RESULT_SURFACE_USED_SUCCESSFULLY -> Log.i(TAG, "VideoPipeline Surface has been safely released by the Camera.")
      SurfaceRequest.Result.RESULT_WILL_NOT_PROVIDE_SURFACE -> Log.i(TAG, "VideoPipeline will not provide a Surface to the Camera.")
      else -> throw Error("Something went wrong. Code: $resultCode")
    }
  }

  override fun close() {
    synchronized(this) {
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
