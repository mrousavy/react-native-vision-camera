package com.margelo.nitro.camera.hybrids

import android.media.ImageWriter
import android.view.Surface
import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import com.margelo.nitro.camera.HybridFrameRendererSpec
import com.margelo.nitro.camera.HybridFrameSpec
import com.margelo.nitro.camera.public.NativeFrame
import com.margelo.nitro.camera.public.NativeFrameRenderer

class HybridFrameRenderer :
  HybridFrameRendererSpec(),
  NativeFrameRenderer {
  companion object {
    private const val DEFAULT_QUEUE_DEPTH = 3
  }

  private var imageWriter: ImageWriter? = null

  @OptIn(ExperimentalGetImage::class)
  override fun renderFrame(frame: HybridFrameSpec) {
    val nativeFrame =
      frame as? NativeFrame
        ?: throw Error("Frame is not of type `NativeFrame`!")
    val image =
      nativeFrame.image.image
        ?: throw Error("Image is invalid!")
    imageWriter?.queueInputImage(image)
  }

  override fun connectSurface(surface: Surface) {
    disconnectSurface()
    imageWriter = ImageWriter.newInstance(surface, DEFAULT_QUEUE_DEPTH)
  }

  override fun disconnectSurface() {
    imageWriter?.close()
    imageWriter = null
  }

  override fun dispose() {
    super.dispose()
    disconnectSurface()
  }
}
