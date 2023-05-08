package com.mrousavy.camera.preview

import android.graphics.SurfaceTexture
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

  val inputSurface: SurfaceTexture

  init {
    mHybridData = initHybrid(inputSize.width, inputSize.height, outputSurface)
    val inputSurfaceId = getInputSurfaceTextureId()
    inputSurface = SurfaceTexture(inputSurfaceId)
    inputSurface.setDefaultBufferSize(inputSize.width, inputSize.height)
  }

  fun release() {
    mHybridData.resetNative()
    inputSurface.release()
  }

  fun setOutputSize(size: Size) {
    setOutputSize(size.width, size.height)
  }

  private external fun initHybrid(inputWidth: Int, inputHeight: Int, outputSurface: Any): HybridData
  private external fun setOutputSize(width: Int, height: Int)
  private external fun getInputSurfaceTextureId(): Int
  external fun drawFrame()
}
