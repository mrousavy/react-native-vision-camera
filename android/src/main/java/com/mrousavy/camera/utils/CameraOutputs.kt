package com.mrousavy.camera.utils

import android.graphics.ImageFormat
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.Image
import android.media.ImageReader
import android.util.Log
import android.util.Size
import android.view.Surface
import com.mrousavy.camera.CameraQueues
import com.mrousavy.camera.extensions.ImageReaderOutput
import com.mrousavy.camera.extensions.OutputType
import com.mrousavy.camera.extensions.SurfaceOutput
import com.mrousavy.camera.extensions.closestToOrMax
import java.io.Closeable
import java.lang.IllegalStateException

class CameraOutputs(val cameraId: String,
                    cameraManager: CameraManager,
                    val preview: PreviewOutput? = null,
                    val photo: PhotoOutput? = null,
                    val video: VideoOutput? = null,
                    val callback: Callback): Closeable {
  companion object {
    private const val TAG = "CameraOutputs"
    private const val VIDEO_OUTPUT_BUFFER_SIZE = 3
    private const val PHOTO_OUTPUT_BUFFER_SIZE = 3
  }

  data class PreviewOutput(val surface: Surface)
  data class PhotoOutput(val targetSize: Size? = null,
                         val format: Int = ImageFormat.JPEG)
  data class VideoOutput(val onFrame: (image: Image) -> Unit,
                         val targetSize: Size? = null,
                         val format: Int = ImageFormat.YUV_420_888)

  interface Callback {
    fun onPhotoCaptured(image: Image)
  }

  var previewOutput: SurfaceOutput? = null
    private set
  var photoOutput: ImageReaderOutput? = null
    private set
  var videoOutput: ImageReaderOutput? = null
    private set

  val size: Int
    get() {
      var size = 0
      if (previewOutput != null) size++
      if (photoOutput != null) size++
      if (videoOutput != null) size++
      return size
    }

  override fun equals(other: Any?): Boolean {
    if (other !is CameraOutputs) return false
    return this.cameraId == other.cameraId
      && (this.preview == null) == (other.preview == null)
      && this.photo?.targetSize == other.photo?.targetSize
      && this.photo?.format == other.photo?.format
      && this.video?.targetSize == other.video?.targetSize
      && this.video?.format == other.video?.format
  }

  override fun hashCode(): Int {
    var result = cameraId.hashCode()
    result += (preview?.hashCode() ?: 0)
    result += (photo?.hashCode() ?: 0)
    result += (video?.hashCode() ?: 0)
    return result
  }

  override fun close() {
    photoOutput?.close()
    videoOutput?.close()
  }

  override fun toString(): String {
    val strings = arrayListOf<String>()
    photoOutput?.let {
      strings.add("${it.outputType} (${it.imageReader.width} x ${it.imageReader.height} in format #${it.imageReader.imageFormat})")
    }
    videoOutput?.let {
      strings.add("${it.outputType} (${it.imageReader.width} x ${it.imageReader.height} in format #${it.imageReader.imageFormat})")
    }
    previewOutput?.let {
      strings.add("${it.outputType}")
    }
    return strings.joinToString(", ", "[", "]")
  }

  init {
    val characteristics = cameraManager.getCameraCharacteristics(cameraId)
    val config = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!

    Log.i(TAG, "Preparing Outputs for Camera $cameraId...")

    // Preview output: Low resolution repeating images (SurfaceView)
    if (preview != null) {
      Log.i(TAG, "Adding native preview view output.")
      previewOutput = SurfaceOutput(preview.surface, OutputType.PREVIEW)
    }

    // Photo output: High quality still images (takePhoto())
    if (photo != null) {
      val size = config.getOutputSizes(photo.format).closestToOrMax(photo.targetSize)

      val imageReader = ImageReader.newInstance(size.width, size.height, photo.format, PHOTO_OUTPUT_BUFFER_SIZE)
      imageReader.setOnImageAvailableListener({ reader ->
        val image = reader.acquireLatestImage() ?: return@setOnImageAvailableListener
        callback.onPhotoCaptured(image)
      }, CameraQueues.cameraQueue.handler)

      Log.i(TAG, "Adding ${size.width}x${size.height} photo output. (Format: $photo.format)")
      photoOutput = ImageReaderOutput(imageReader, OutputType.PHOTO)
    }

    // Video output: High resolution repeating images (startRecording() or useFrameProcessor())
    if (video != null) {
      val size = config.getOutputSizes(video.format).closestToOrMax(video.targetSize)

      val imageReader = ImageReader.newInstance(size.width, size.height, video.format, VIDEO_OUTPUT_BUFFER_SIZE)
      imageReader.setOnImageAvailableListener({ reader ->
        try {
          val image = reader.acquireNextImage() ?: return@setOnImageAvailableListener
          video.onFrame(image)
        } catch (e: IllegalStateException) {
          Log.e(TAG, "Failed to acquire a new Image, dropping a Frame.. The Frame Processor cannot keep up with the Camera's FPS!", e)
        }
      }, CameraQueues.videoQueue.handler)

      Log.i(TAG, "Adding ${size.width}x${size.height} video output. (Format: $video.format)")
      videoOutput = ImageReaderOutput(imageReader, OutputType.VIDEO)
    }

    Log.i(TAG, "Prepared $size Outputs for Camera $cameraId!")
  }
}
