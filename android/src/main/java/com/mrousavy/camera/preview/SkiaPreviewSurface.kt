package com.mrousavy.camera.preview

import android.graphics.ImageFormat
import android.graphics.SurfaceTexture
import android.hardware.HardwareBuffer
import android.media.Image
import android.media.ImageReader
import android.util.Log
import android.util.Size
import android.view.Surface
import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import com.mrousavy.camera.frameprocessor.Frame

@Suppress("KotlinJniMissingFunction")
class SkiaPreviewSurface(textureId: Int): SurfaceTexture(textureId) {
  companion object {
    private const val OPEN_GL_VERSION = 2
    private const val TAG = "SkiaPreviewSurface"
  }

  @DoNotStrip
  private val mHybridData: HybridData

  init {
    mHybridData = initHybrid(textureId)
  }

  override fun updateTexImage() {
    super.updateTexImage()
    Log.d(TAG, "Call Skia Frame Processor here!")
    onFrame()
  }

  fun setOutputSize(size: Size) {
    setOutputSize(size.width, size.height)
  }

  private external fun initHybrid(textureId: Int): HybridData
  private external fun setOutputSize(width: Int, height: Int)
  private external fun onFrame()
}
