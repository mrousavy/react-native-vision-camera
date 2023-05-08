package com.mrousavy.camera.preview

import android.graphics.ImageFormat
import android.graphics.SurfaceTexture
import android.hardware.HardwareBuffer
import android.media.ImageReader
import android.util.Size
import android.view.Surface
import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip

@Suppress("KotlinJniMissingFunction")
class SkiaPreviewSurface(inputSize: Size, outputSurface: Surface) {
  companion object {
    private const val OPEN_GL_VERSION = 2
    private const val TAG = "SkiaPreviewSurface"
  }

  @DoNotStrip
  private val mHybridData: HybridData
  private var imageReader: ImageReader? = null

  init {
    mHybridData = initHybrid(inputSize.width, inputSize.height, outputSurface)
  }

  fun release() {
    mHybridData.resetNative()
    imageReader?.close()
    imageReader = null
  }

  fun setOutputSize(size: Size) {
    setOutputSize(size.width, size.height)
  }

  fun createInputSurface(width: Int, height: Int): Surface {
    imageReader?.close()
    imageReader = null
    // TODO: HardwareBuffer.USAGE_GPU_DATA_BUFFER
    imageReader = ImageReader.newInstance(width, height, ImageFormat.YUV_420_888, 5)
    return imageReader!!.surface
  }

  private external fun initHybrid(inputWidth: Int, inputHeight: Int, outputSurface: Any): HybridData
  private external fun setOutputSize(width: Int, height: Int)
  private external fun setInputSurface(surface: Any)
  external fun drawFrame()
}
