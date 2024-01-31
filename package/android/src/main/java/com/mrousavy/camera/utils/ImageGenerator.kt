package com.mrousavy.camera.utils

import android.graphics.SurfaceTexture
import android.media.Image
import android.media.ImageWriter
import android.os.Build
import android.view.Surface
import androidx.annotation.RequiresApi
import java.io.Closeable

/**
 * A helper class to generate a single Image.
 */
@RequiresApi(Build.VERSION_CODES.Q)
class ImageGenerator(width: Int, height: Int, format: Int) : Closeable {
  private val texture = SurfaceTexture(0).apply { setDefaultBufferSize(width, height)  }
  private val surface = Surface(texture)
  private val imageWriter = ImageWriter.newInstance(surface, 1, format)

  override fun close() {
    imageWriter.close()
    surface.release()
    texture.release()
  }

  /**
   * Creates a single image. You need to call [Image.close] on the Image after using it.
   */
  private fun createImage(): Image {
    return imageWriter.dequeueInputImage()
  }

  /**
   * Gets the native HardwareBuffer format of Images of this type, or null if HardwareBuffers are not supported.
   */
  fun getHardwareBufferFormat(): Int? {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      return imageWriter.hardwareBufferFormat
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      val image = createImage()
      val format = image.hardwareBuffer?.format
      image.close()
      return format
    }
    return null
  }
}
