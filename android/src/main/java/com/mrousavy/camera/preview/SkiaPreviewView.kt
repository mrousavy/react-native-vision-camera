package com.mrousavy.camera.preview

import android.content.Context
import android.util.Log
import android.util.Size
import android.view.Choreographer
import android.view.SurfaceHolder
import android.view.SurfaceView
import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip

@Suppress("KotlinJniMissingFunction")
class SkiaPreviewView(context: Context): SurfaceView(context), SurfaceHolder.Callback {
  companion object {
    private const val TAG = "SkiaPreviewView"
  }

  @DoNotStrip
  private val mHybridData: HybridData
  var previewSurface: SkiaPreviewSurface? = null

  init {
    mHybridData = initHybrid()
    this.holder.addCallback(this)
  }

  private external fun initHybrid(): HybridData
  private external fun onSizeChanged(width: Int, height: Int)

  private fun drawNextFrame(timestamp: Long) {
    previewSurface?.drawFrame()

    Choreographer.getInstance().postFrameCallback {
      drawNextFrame(it)
    }
  }

  override fun surfaceCreated(holder: SurfaceHolder) {
    Log.d(TAG, "onSurfaceCreated()")
    previewSurface = SkiaPreviewSurface(Size(400, 700), holder.surface)
    Choreographer.getInstance().postFrameCallback { timestamp ->
      drawNextFrame(timestamp)
    }
  }

  override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
    Log.d(TAG, "onSurfaceChanged()")
    previewSurface?.setOutputSize(Size(width, height))
  }

  override fun surfaceDestroyed(holder: SurfaceHolder) {
    Log.d(TAG, "surfaceDestroyed()")
    previewSurface?.release()
    previewSurface = null
  }

}
