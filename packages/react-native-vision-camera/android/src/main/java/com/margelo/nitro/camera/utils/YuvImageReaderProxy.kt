package com.margelo.nitro.camera.utils

import android.annotation.SuppressLint
import android.graphics.ImageFormat
import android.hardware.HardwareBuffer
import android.media.ImageReader
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.view.Surface
import androidx.annotation.RequiresApi
import androidx.camera.core.ImageProxy
import androidx.camera.core.impl.ImageReaderProxy
import java.util.concurrent.Executor

/**
 * An implementation of [ImageReaderProxy] that streams [android.media.Image]s
 * in [ImageFormat.YUV_420_888], allocated with
 * [HardwareBuffer.USAGE_GPU_SAMPLED_IMAGE] when the device supports it.
 *
 * CameraX's default ImageReader allocates CPU-only buffers, whose
 * `HardwareBuffer`s cannot be imported and sampled by GPU APIs
 * (Vulkan/OpenGL/WebGPU/Skia). By additionally requesting
 * [HardwareBuffer.USAGE_GPU_SAMPLED_IMAGE], the Frames streamed by this
 * reader stay CPU-readable *and* can be imported zero-copy as GPU textures
 * via their `HardwareBuffer` (see `Frame.getNativeBuffer()`).
 */
@SuppressLint("RestrictedApi")
@RequiresApi(Build.VERSION_CODES.Q)
class YuvImageReaderProxy : ImageReaderProxy {
  private val imageReaderThread = HandlerThread("YuvImageReaderProxy").apply { start() }
  private val imageReaderHandler = Handler(imageReaderThread.looper)
  private val imageReader: ImageReader

  constructor(width: Int, height: Int, maxImages: Int) {
    val usage = HardwareBuffer.USAGE_CPU_READ_OFTEN or HardwareBuffer.USAGE_GPU_SAMPLED_IMAGE
    imageReader =
      if (HardwareBuffer.isSupported(width, height, HardwareBuffer.YCBCR_420_888, 1, usage)) {
        ImageReader.newInstance(width, height, ImageFormat.YUV_420_888, maxImages, usage)
      } else {
        // This device cannot allocate GPU-sampleable YUV buffers - fall back
        // to CPU-only buffers, same as CameraX's default ImageReader.
        ImageReader.newInstance(width, height, ImageFormat.YUV_420_888, maxImages)
      }
  }

  override fun acquireLatestImage(): ImageProxy? {
    val image =
      imageReader.acquireLatestImage()
        ?: return null
    return YuvImageProxy(image)
  }

  override fun acquireNextImage(): ImageProxy? {
    val image =
      imageReader.acquireNextImage()
        ?: return null
    return YuvImageProxy(image)
  }

  override fun close() {
    imageReader.close()
    imageReaderThread.quitSafely()
  }

  override fun getHeight(): Int {
    return imageReader.height
  }

  override fun getWidth(): Int {
    return imageReader.width
  }

  override fun getImageFormat(): Int {
    return imageReader.imageFormat
  }

  override fun getMaxImages(): Int {
    return imageReader.maxImages
  }

  override fun getSurface(): Surface? {
    return imageReader.surface
  }

  override fun setOnImageAvailableListener(
    listener: ImageReaderProxy.OnImageAvailableListener,
    executor: Executor,
  ) {
    imageReader.setOnImageAvailableListener({ reader ->
      executor.execute {
        listener.onImageAvailable(this)
      }
    }, imageReaderHandler)
  }

  override fun clearOnImageAvailableListener() {
    imageReader.setOnImageAvailableListener(null, null)
  }
}
