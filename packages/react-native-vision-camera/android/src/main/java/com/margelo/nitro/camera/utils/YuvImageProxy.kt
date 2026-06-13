package com.margelo.nitro.camera.utils

import android.annotation.SuppressLint
import android.graphics.Matrix
import android.graphics.Rect
import android.media.Image
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.FlashState
import androidx.camera.core.ImageInfo
import androidx.camera.core.ImageProxy
import androidx.camera.core.ImmutableImageInfo
import androidx.camera.core.impl.TagBundle
import java.nio.ByteBuffer

/**
 * An implementation of [ImageProxy] that holds an [Image]
 * in [android.graphics.ImageFormat.YUV_420_888].
 */
class YuvImageProxy(
  private val image: Image,
) : ImageProxy {
  private val imageInfo: ImageInfo
  private val planes: Array<ImageProxy.PlaneProxy> by lazy {
    image.planes.map { plane -> PlaneProxy(plane) }.toTypedArray()
  }

  init {
    // rotationDegrees and transformMatrix are placeholder values here.
    // CameraX's ImageAnalysis wraps this proxy in a SettableImageProxy
    // with the correct relative rotation and sensor-to-buffer transform
    // before delivering it to the analyzer callback.
    @SuppressLint("RestrictedApi")
    imageInfo =
      ImmutableImageInfo.create(
        TagBundle.emptyBundle(),
        image.timestamp,
        0,
        Matrix(),
        FlashState.NOT_FIRED,
      )
  }

  private class PlaneProxy(
    private val plane: Image.Plane,
  ) : ImageProxy.PlaneProxy {
    override fun getRowStride(): Int {
      return plane.rowStride
    }

    override fun getPixelStride(): Int {
      return plane.pixelStride
    }

    override fun getBuffer(): ByteBuffer {
      return plane.buffer
    }
  }

  override fun close() {
    image.close()
  }

  override fun getCropRect(): Rect {
    return image.cropRect
  }

  override fun setCropRect(rect: Rect?) {
    image.cropRect = rect
  }

  override fun getFormat(): Int {
    return image.format
  }

  override fun getHeight(): Int {
    return image.height
  }

  override fun getWidth(): Int {
    return image.width
  }

  override fun getPlanes(): Array<out ImageProxy.PlaneProxy> {
    return planes
  }

  override fun getImageInfo(): ImageInfo {
    return imageInfo
  }

  @ExperimentalGetImage
  override fun getImage(): Image {
    return image
  }
}
