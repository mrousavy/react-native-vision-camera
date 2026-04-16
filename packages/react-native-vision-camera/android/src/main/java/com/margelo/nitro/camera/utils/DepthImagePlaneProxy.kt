package com.margelo.nitro.camera.utils

import android.media.Image
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageProxy
import java.nio.ByteBuffer

@ExperimentalGetImage
class DepthImagePlaneProxy(
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
