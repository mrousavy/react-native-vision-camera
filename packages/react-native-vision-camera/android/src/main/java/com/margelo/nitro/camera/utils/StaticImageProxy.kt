package com.margelo.nitro.camera.utils

import android.annotation.SuppressLint
import android.graphics.Matrix
import android.graphics.Rect
import android.media.Image
import android.media.ImageReader
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.FlashState
import androidx.camera.core.ImageInfo
import androidx.camera.core.ImageProxy
import androidx.camera.core.ImmutableImageInfo
import androidx.camera.core.impl.TagBundle
import com.margelo.nitro.camera.extensions.mapToArray

/**
 * An implementation of [ImageProxy] that holds a static [Image]
 * which was created from an [ImageReader] outside of a Camera pipeline,
 * for example by converting a Bitmap to a camera-like YUV [Image].
 *
 * Closing this [ImageProxy] closes both the [Image] and its owning [ImageReader].
 */
class StaticImageProxy(
  private val image: Image,
  private val imageReader: ImageReader,
  rotationDegrees: Int,
) : ImageProxy {
  private val imageInfo: ImageInfo

  init {
    @SuppressLint("RestrictedApi")
    imageInfo =
      ImmutableImageInfo.create(
        TagBundle.emptyBundle(),
        image.timestamp,
        rotationDegrees,
        Matrix(),
        FlashState.NOT_FIRED,
      )
  }

  override fun close() {
    image.close()
    imageReader.close()
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

  @ExperimentalGetImage
  override fun getPlanes(): Array<out ImageProxy.PlaneProxy?> {
    return image.planes.mapToArray { ImagePlaneProxy(it) }
  }

  override fun getImageInfo(): ImageInfo {
    return imageInfo
  }

  @ExperimentalGetImage
  override fun getImage(): Image {
    return image
  }
}
