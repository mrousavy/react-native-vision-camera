package com.mrousavy.camera.core

import android.annotation.SuppressLint
import android.hardware.HardwareBuffer
import android.media.ImageReader
import android.media.ImageWriter
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.camera.core.CameraEffect
import androidx.camera.core.SurfaceOutput
import androidx.camera.core.SurfaceProcessor
import androidx.camera.core.SurfaceRequest
import androidx.camera.core.impl.OutputSurface
import com.mrousavy.camera.CameraView
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.PixelFormat

@SuppressLint("RestrictedApi")
class FrameProcessorEffect(
  format: PixelFormat = PixelFormat.NATIVE,
  enableGpuBuffers: Boolean = false,
  callback: CameraSession.Callback,
  targets: Int = VIDEO_CAPTURE,
) : CameraEffect(
  targets,
  TRANSFORMATION_CAMERA_AND_SURFACE_ROTATION,
  CameraQueues.videoQueue.executor,
  FrameProcessorSurfaceProcessor(format, enableGpuBuffers, callback),
  { error -> callback.onError(error) }
) {
  // CameraEffect holds the SurfaceProcessor

  class FrameProcessorSurfaceProcessor(private val format: PixelFormat, private val enableGpuBuffers: Boolean, private val callback: CameraSession.Callback) : SurfaceProcessor {
    companion object {
      private const val TAG = "FrameProcessorEffect"
      private const val MAX_IMAGES = 3
    }
    private var imageReader: ImageReader? = null
    private var imageWriter: ImageWriter? = null
    private val queue = CameraQueues.videoQueue

    override fun onInputSurface(request: SurfaceRequest) {
      val requestedSize = request.resolution
      val requestedFormat = request.deferrableSurface.prescribedStreamFormat
      Log.i(TAG, "Requested new input surface: $requestedSize in format #$requestedFormat")

      val currentImageReader = imageReader
      if (currentImageReader != null &&
        currentImageReader.width == requestedSize.width &&
        currentImageReader.height == requestedSize.height &&
        currentImageReader.imageFormat == requestedFormat) {
        Log.i(TAG, "Current ImageReader matches those requirements, attempting to re-use it...")
        request.provideSurface(currentImageReader.surface, queue.executor) { result ->
          onImageReaderSurfaceClosed(currentImageReader, result.resultCode)
        }
      }

      val imageReader = if (enableGpuBuffers && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        // Use GPU buffer flags for ImageReader for faster forwarding
        val flags = getRecommendedHardwareBufferFlags(requestedSize.width, requestedSize.height)
        Log.i(TAG, "Creating ImageReader with new GPU-Buffers API... (Usage Flags: $flags)")
        ImageReader.newInstance(requestedSize.width, requestedSize.height, requestedFormat, MAX_IMAGES, flags)
      } else {
        // Use default CPU flags for ImageReader
        Log.i(TAG, "Creating ImageReader with default CPU usage flag...")
        ImageReader.newInstance(requestedSize.width, requestedSize.height, requestedFormat, MAX_IMAGES)
      }

      imageReader.setOnImageAvailableListener({ reader ->
         try {
           val image = reader.acquireLatestImage() ?: return@setOnImageAvailableListener

           val orientation = Orientation.PORTRAIT // TODO: orientation
           val isMirrored = false // TODO: isMirrored
           val frame = Frame(image, image.timestamp, orientation, isMirrored)

           frame.incrementRefCount()
           try {
             callback.onFrame(frame)
           } finally {
             frame.decrementRefCount()
           }
         } catch (e: Throwable) {
           Log.e(TAG, "Failed to process image! ${e.message}", e)
           callback.onError(e)
         }
      }, CameraQueues.videoQueue.handler)

      request.provideSurface(imageReader.surface, queue.executor) { result ->
        onImageReaderSurfaceClosed(imageReader, result.resultCode)
      }
      this.imageReader = imageReader
    }

    private fun onImageReaderSurfaceClosed(imageReader: ImageReader, resultCode: Int) {
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

    private fun onOutputSurfaceClosed(event: SurfaceOutput.Event, imageWriter: ImageWriter?) {
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

    override fun onOutputSurface(surfaceOutput: SurfaceOutput) {
      Log.i(TAG, "Received new output surface: ${surfaceOutput.size} in format #${surfaceOutput.format}")

      var imageWriter: ImageWriter? = null
      val surface = surfaceOutput.getSurface(queue.executor) { event ->
        onOutputSurfaceClosed(event, imageWriter)
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        // Use custom target format, ImageWriter might be able to convert between the formats.
        Log.i(TAG, "Creating ImageWriter with target format $format...")
        imageWriter = ImageWriter.newInstance(surface, MAX_IMAGES, format.toImageFormat())
      } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        // Use default format, ImageWriter might not be able to convert between the formats and crash....
        Log.i(TAG, "Creating ImageWriter with default format (${surfaceOutput.format})...")
        imageWriter = ImageWriter.newInstance(surface, MAX_IMAGES)
      } else {
        // ImageWriters are not available at all.
        val error = RecordingWhileFrameProcessingUnavailable()
        Log.e(TAG, error.message)
        callback.onError(error)
      }
      this.imageWriter = imageWriter
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
