package com.mrousavy.camera.skia

import android.content.Context
import android.graphics.SurfaceTexture
import android.opengl.GLSurfaceView
import android.util.Log
import android.view.Surface
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import java.io.Closeable

@Suppress("KotlinJniMissingFunction")
class SkiaPreviewView(context: Context): GLSurfaceView(context), Closeable {
  companion object {
    private val TAG = "SkiaPreviewView"
  }

  @DoNotStrip
  private var mHybridData: HybridData

  private val textureId: Int
  private val surfaceTexture: SurfaceTexture
  val surface: Surface

  init {
    Log.i(TAG, "Initializing SkiaPreviewView...")
    mHybridData = initHybrid()
    Log.i(TAG, "Initializing SkiaPreviewView (OpenGL)...")
    initOpenGL()
    Log.i(TAG, "SkiaPreviewView initialized!")
    textureId = createTexture()
    surfaceTexture = SurfaceTexture(textureId)
    surface = Surface(surfaceTexture)
  }

  override fun close() {
    surface.release()
    surfaceTexture.release()
    destroyTexture(textureId)
    destroy()
  }

  private external fun initHybrid(): HybridData
  private external fun initOpenGL()
  private external fun destroy()
  private external fun createTexture(): Int
  private external fun destroyTexture(textureId: Int)
}
