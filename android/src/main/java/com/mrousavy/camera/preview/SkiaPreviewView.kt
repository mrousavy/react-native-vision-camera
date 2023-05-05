package com.mrousavy.camera.preview

import android.content.Context
import android.graphics.SurfaceTexture
import android.view.TextureView
import android.view.TextureView.SurfaceTextureListener
import android.widget.FrameLayout
import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip

@Suppress("KotlinJniMissingFunction")
class SkiaPreviewView(context: Context): FrameLayout(context) {
  val textureView: TextureView
  @DoNotStrip
  private val mHybridData: HybridData

  init {
    mHybridData = initHybrid()

    textureView = TextureView(context)
    textureView.surfaceTextureListener = object : SurfaceTextureListener {
      override fun onSurfaceTextureAvailable(surface: SurfaceTexture, width: Int, height: Int) {
        this@SkiaPreviewView.onSurfaceTextureAvailable(surface, width, height)
      }

      override fun onSurfaceTextureSizeChanged(surface: SurfaceTexture, width: Int, height: Int) {
        this@SkiaPreviewView.onSurfaceTextureSizeChanged(surface, width, height)
      }

      override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
        this@SkiaPreviewView.onSurfaceTextureDestroyed(surface)
        surface.release()
        return true
      }

      override fun onSurfaceTextureUpdated(surface: SurfaceTexture) {
        this@SkiaPreviewView.onSurfaceTextureUpdated(surface)
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

}
