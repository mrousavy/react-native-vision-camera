package com.margelo.nitro.camera.utils

import android.annotation.SuppressLint
import android.graphics.ImageFormat
import android.hardware.HardwareBuffer
import android.media.ImageReader
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.view.Surface
import androidx.camera.core.ImageProxy
import androidx.camera.core.impl.ImageReaderProxy
import java.util.concurrent.Executor

/**
 * An implementation of [ImageReaderProxy] that streams [android.media.Image]s
 * in [ImageFormat.PRIVATE].
 */
@SuppressLint("RestrictedApi")
class PrivateImageReaderProxy : ImageReaderProxy {
  private val imageReaderThread = HandlerThread("PrivateImageReaderProxy").apply { start() }
  private val imageReaderHandler = Handler(imageReaderThread.looper)
  private val imageReader: ImageReader

  constructor(width: Int, height: Int, maxImages: Int) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      imageReader =
        ImageReader.newInstance(
          width,
          height,
          ImageFormat.PRIVATE,
          maxImages,
          HardwareBuffer.USAGE_GPU_SAMPLED_IMAGE,
        )
    } else {
      imageReader = ImageReader.newInstance(width, height, ImageFormat.PRIVATE, maxImages)
    }
  }

  override fun acquireLatestImage(): ImageProxy? {
    val image =
      imageReader.acquireLatestImage()
        ?: return null
    return PrivateImageProxy(image)
  }

  override fun acquireNextImage(): ImageProxy? {
    val image =
      imageReader.acquireNextImage()
        ?: return null
    return PrivateImageProxy(image)
  }

  override fun close() {
    imageReader.close()
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
