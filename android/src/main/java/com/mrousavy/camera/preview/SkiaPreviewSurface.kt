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
class SkiaPreviewSurface(inputSurfaceWidth: Int, inputSurfaceHeight: Int) {
  companion object {
    private const val OPEN_GL_VERSION = 2
    private const val TAG = "SkiaPreviewSurface"
  }

  @DoNotStrip
  private val mHybridData: HybridData
  val surface: SurfaceTexture

  init {
    mHybridData = initHybrid(null, inputSurfaceWidth, inputSurfaceHeight)
    surface = SurfaceTexture(getSurfaceId())
    surface.setOnFrameAvailableListener {
      Log.d(TAG, "Frame Available!!!!")
      it.updateTexImage()
      onFrame()
    }
  }

  fun release() {
    mHybridData.resetNative()
  }

  fun setOutputSize(size: Size) {
    setOutputSize(size.width, size.height)
  }

  private external fun initHybrid(inputSurface: Any?, inputWidth: Int, inputHeight: Int): HybridData
  private external fun setOutputSize(width: Int, height: Int)
  private external fun onFrame()
  private external fun getSurfaceId(): Int
  external fun setOutputSurface(surface: Any)
}
