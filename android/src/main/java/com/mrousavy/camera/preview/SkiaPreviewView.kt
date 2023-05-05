package com.mrousavy.camera.preview

import android.content.Context
import android.graphics.SurfaceTexture
import android.util.Log
import android.view.Surface
import android.view.SurfaceControl
import android.view.TextureView
import android.view.TextureView.SurfaceTextureListener
import android.widget.FrameLayout
import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip

@Suppress("KotlinJniMissingFunction")
class SkiaPreviewView(context: Context): FrameLayout(context) {
  val textureView: TextureView
  val surface: SurfaceTexture
  @DoNotStrip
  private val mHybridData: HybridData

  init {
    mHybridData = initHybrid()

    repeat(5) {
      val x = createOffscreenTexture(120, 120)
      Log.d("SKP", x.toString())
    }
    surface = SurfaceTexture(createOffscreenTexture(1920, 1080))

    textureView = TextureView(context)
    textureView.surfaceTextureListener = object : SurfaceTextureListener {
      override fun onSurfaceTextureAvailable(surface: SurfaceTexture, width: Int, height: Int) {
        this@SkiaPreviewView.onSurfaceTextureAvailable(Surface(surface), width, height)
      }

      override fun onSurfaceTextureSizeChanged(surface: SurfaceTexture, width: Int, height: Int) {
        this@SkiaPreviewView.onSurfaceTextureSizeChanged(Surface(surface), width, height)
      }

      override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
        this@SkiaPreviewView.onSurfaceTextureDestroyed(Surface(surface))
        surface.release()
        return true
      }

      override fun onSurfaceTextureUpdated(surface: SurfaceTexture) {
        this@SkiaPreviewView.onSurfaceTextureUpdated(Surface(surface))
      }
    }

    textureView.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    addView(textureView)
  }

  private external fun initHybrid(): HybridData
  private external fun onSurfaceTextureAvailable(surface: Any, width: Int, height: Int)
  private external fun onSurfaceTextureSizeChanged(surface: Any, width: Int, height: Int)
  private external fun onSurfaceTextureDestroyed(surface: Any)
  private external fun onSurfaceTextureUpdated(surface: Any)
  private external fun createOffscreenTexture(width: Int, height: Int): Int

}
