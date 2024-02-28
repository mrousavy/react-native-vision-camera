package com.mrousavy.camera.core

import android.annotation.SuppressLint
import android.hardware.HardwareBuffer
import android.media.ImageReader
import android.media.ImageReader.OnImageAvailableListener
import android.media.ImageWriter
import android.os.Build
import android.util.Log
import androidx.annotation.ChecksSdkIntAtLeast
import androidx.annotation.RequiresApi
import androidx.camera.core.CameraEffect
import androidx.camera.core.SurfaceOutput
import androidx.camera.core.SurfaceProcessor
import androidx.camera.core.SurfaceRequest
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.PixelFormat
import com.mrousavy.camera.utils.ImageFormatUtils

@SuppressLint("RestrictedApi")
class FrameProcessorEffect(
  format: PixelFormat = PixelFormat.NATIVE,
  enableGpuBuffers: Boolean = false,
  callback: CameraSession.Callback,
  targets: Int = PREVIEW
) : CameraEffect(
  targets,
  CameraQueues.videoQueue.executor,
  FrameProcessorSurfaceProcessor(format, enableGpuBuffers, callback),
  { error -> callback.onError(error) }
) {
  // CameraEffect holds the SurfaceProcessor

  class FrameProcessorSurfaceProcessor(
    private val format: PixelFormat,
    private val enableGpuBuffers: Boolean,
    private val callback: CameraSession.Callback
  ) : SurfaceProcessor,
    OnImageAvailableListener {
    companion object {
      private const val TAG = "FrameProcessorEffect"
      private const val MAX_IMAGES = 3
    }
    private var imageReader: ImageReader? = null
    private var imageWriter: ImageWriter? = null
    private val queue = CameraQueues.videoQueue

    override fun onImageAvailable(reader: ImageReader) {
      synchronized(this) {
        try {
          val image = reader.acquireLatestImage() ?: return

          val orientation = Orientation.PORTRAIT // TODO: orientation
          val isMirrored = false // TODO: isMirrored
          val frame = Frame(image, image.timestamp, orientation, isMirrored)

          frame.incrementRefCount()
          try {
            callback.onFrame(frame)

            val imageWriter = imageWriter
            if (imageWriter != null) {
              Log.i(TAG, "Forwarding to ImageWriter...")
              if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                imageWriter.queueInputImage(image)
              }
            }
          } finally {
            frame.decrementRefCount()
          }
        } catch (e: Throwable) {
          Log.e(TAG, "Failed to process image! ${e.message}", e)
          callback.onError(e)
        }
      }
    }

    override fun onInputSurface(request: SurfaceRequest) {
      synchronized(this) {
        val requestedSize = request.resolution
        val requestedFormat = request.deferrableSurface.prescribedStreamFormat
        Log.i(TAG, "Requested new input surface: $requestedSize in format ${ImageFormatUtils.imageFormatToString(requestedFormat)}")

        // The actual format we use might be different than the format of the output Surface (e.g. SurfaceView/MediaRecorder),
        // because the user might want YUV images while the output Surface is PRIVATE.
        // Since Android Q, ImageWriters can convert between such formats, so if that is possible, we will use a custom format,
        // otherwise we will need to fall back to the default format.
        var actualFormat = format.toImageFormat()
        if (!isImageWriterCustomFormatsSupported() && actualFormat != requestedFormat) {
          Log.w(
            TAG,
            "Trying to use format ${ImageFormatUtils.imageFormatToString(actualFormat)}, but output " +
              "surface is ${ImageFormatUtils.imageFormatToString(
                requestedFormat
              )} and ImageWriters with custom formats are not available. " +
              "Falling back to using format ${ImageFormatUtils.imageFormatToString(requestedFormat)}..."
          )
          actualFormat = requestedFormat
        }
        Log.i(
          TAG,
          "Creating ImageReader (${ImageFormatUtils.imageFormatToString(actualFormat)}) -> " +
            "ImageWriter (${ImageFormatUtils.imageFormatToString(requestedFormat)}) pipeline..."
        )

        val currentImageReader = imageReader
        if (currentImageReader != null &&
          currentImageReader.width == requestedSize.width &&
          currentImageReader.height == requestedSize.height &&
          currentImageReader.imageFormat == actualFormat
        ) {
          Log.i(TAG, "Current ImageReader matches those requirements, attempting to re-use it...")
          request.provideSurface(currentImageReader.surface, queue.executor) { result ->
            onImageReaderSurfaceClosed(currentImageReader, result.resultCode)
          }
        }

        val imageReader = if (enableGpuBuffers && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          // Use GPU buffer flags for ImageReader for faster forwarding
          val flags = getRecommendedHardwareBufferFlags(requestedSize.width, requestedSize.height)
          Log.i(TAG, "Creating ImageReader with new GPU-Buffers API... (Usage Flags: $flags)")
          ImageReader.newInstance(requestedSize.width, requestedSize.height, actualFormat, MAX_IMAGES, flags)
        } else {
          // Use default CPU flags for ImageReader
          Log.i(TAG, "Creating ImageReader with default CPU usage flag...")
          ImageReader.newInstance(requestedSize.width, requestedSize.height, actualFormat, MAX_IMAGES)
        }

        imageReader.setOnImageAvailableListener(this, CameraQueues.videoQueue.handler)

        request.provideSurface(imageReader.surface, queue.executor) { result ->
          onImageReaderSurfaceClosed(imageReader, result.resultCode)
        }
        this.imageReader = imageReader
      }
    }

    override fun onOutputSurface(surfaceOutput: SurfaceOutput) {
      synchronized(this) {
        val requestedFormat = surfaceOutput.format
        Log.i(TAG, "Received new output surface: ${surfaceOutput.size} in format ${ImageFormatUtils.imageFormatToString(requestedFormat)}")

        var imageWriter: ImageWriter? = null
        val surface = surfaceOutput.getSurface(queue.executor) { event ->
          onOutputSurfaceClosed(event, imageWriter)
        }

        if (isImageWriterCustomFormatsSupported()) {
          // Use custom target format, ImageWriter might be able to convert between the formats.
          val customFormat = format.toImageFormat()
          Log.i(TAG, "Creating ImageWriter with target format ${ImageFormatUtils.imageFormatToString(customFormat)}...")
          imageWriter = ImageWriter.newInstance(surface, MAX_IMAGES, customFormat)
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          // Use default format, ImageWriter might not be able to convert between the formats and crash....
          Log.i(TAG, "Creating ImageWriter with default format (${ImageFormatUtils.imageFormatToString(requestedFormat)})...")
          imageWriter = ImageWriter.newInstance(surface, MAX_IMAGES)
        } else {
          // ImageWriters are not available at all.
          val error = RecordingWhileFrameProcessingUnavailable()
          Log.e(TAG, error.message)
          callback.onError(error)
        }
        this.imageWriter = imageWriter
      }
    }

    private fun onImageReaderSurfaceClosed(imageReader: ImageReader, resultCode: Int) {
      synchronized(this) {
        when (resultCode) {
          SurfaceRequest.Result.RESULT_SURFACE_USED_SUCCESSFULLY -> Log.i(TAG, "Camera is done using $imageReader!")
          SurfaceRequest.Result.RESULT_INVALID_SURFACE -> Log.e(TAG, "Camera could not use $imageReader - invalid Surface!")
          SurfaceRequest.Result.RESULT_SURFACE_ALREADY_PROVIDED -> Log.i(TAG, "Camera already used a different Surface!")
          SurfaceRequest.Result.RESULT_REQUEST_CANCELLED -> Log.i(TAG, "Surface Request has been cancelled.!")
          SurfaceRequest.Result.RESULT_WILL_NOT_PROVIDE_SURFACE -> Log.i(TAG, "Surface Request ignored.")
          else -> throw Error("Invalid SurfaceRequest Result State!")
        }
        Log.i(TAG, "Closing ImageReader $imageReader...")
        imageReader.close()
        if (this.imageReader == imageReader) {
          this.imageReader = null
        }
      }
    }

    private fun onOutputSurfaceClosed(event: SurfaceOutput.Event, imageWriter: ImageWriter?) {
      synchronized(this) {
        Log.i(TAG, "Output Surface has been closed! Code: ${event.eventCode}")

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          Log.i(TAG, "Closing ImageWriter $imageWriter...")
          imageWriter?.close()
          if (this.imageWriter == imageWriter) {
            this.imageWriter = null
          }
        }

        event.surfaceOutput.close()
      }
    }

    @ChecksSdkIntAtLeast(api = Build.VERSION_CODES.Q)
    private fun isImageWriterCustomFormatsSupported(): Boolean {
      // Since Android Q (API 29) ImageWriters can also automatically convert between ImageFormats.
      // For example: ImageReader (YUV_420_888) -> ImageWriter (PRIVATE) -> SurfaceView (PRIVATE)
      return Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
    }

    /**
     * Get the recommended HardwareBuffer flags for creating ImageReader instances with.
     *
     * Tries to use [HardwareBuffer.USAGE_GPU_SAMPLED_IMAGE] if possible, [HardwareBuffer.USAGE_CPU_READ_OFTEN]
     * or a combination of both flags if CPU access is needed, and [0] otherwise.
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

    @Suppress("LiftReturnOrAssignment")
    @RequiresApi(Build.VERSION_CODES.Q)
    private fun supportsHardwareBufferFlags(width: Int, height: Int, flags: Long): Boolean {
      val hardwareBufferFormat = format.toHardwareBufferFormat()
      try {
        return HardwareBuffer.isSupported(width, height, hardwareBufferFormat, 1, flags)
      } catch (_: Throwable) {
        return false
      }
    }
  }
}
