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

/**
 * An implementation of [ImageProxy] that hold an [Image]
 * in [android.graphics.ImageFormat.PRIVATE].
 */
class PrivateImageProxy(
  private val image: Image,
) : ImageProxy {
  private val imageInfo: ImageInfo

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

  @ExperimentalGetImage
  override fun getPlanes(): Array<out ImageProxy.PlaneProxy?> {
    // PRIVATE format images have no CPU-accessible planes
    return emptyArray()
  }

  override fun getImageInfo(): ImageInfo {
    return imageInfo
  }

  @ExperimentalGetImage
  override fun getImage(): Image {
    return image
  }
}
