package com.mrousavy.camera.preview

import android.content.Context
import android.graphics.SurfaceTexture
import android.opengl.GLES20.glGenTextures
import android.opengl.GLSurfaceView
import android.util.Log
import android.util.Size
import android.view.Choreographer
import android.view.Surface
import android.view.SurfaceHolder
import android.view.SurfaceView
import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10

@Suppress("KotlinJniMissingFunction")
class SkiaPreviewView(context: Context): GLSurfaceView(context), GLSurfaceView.Renderer {
  companion object {
    private const val TAG = "SkiaPreviewView"
  }

  @DoNotStrip
  private val mHybridData: HybridData
  private var surfaceTexture: SkiaPreviewSurface? = null

  val surface: Surface
    get() {
      return Surface(surfaceTexture!!)
    }

  init {
    setEGLContextClientVersion(2)
    setRenderer(this)
    renderMode = RENDERMODE_WHEN_DIRTY

    mHybridData = initHybrid()
  }

  private external fun initHybrid(): HybridData
  private external fun onSizeChanged(width: Int, height: Int)

  override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
    Log.d(TAG, "onSurfaceCreated(...)")
    val textures = IntArray(2)
    glGenTextures(2, textures, 0)
    surfaceTexture = SkiaPreviewSurface(textures[0])
  }

  override fun onSurfaceChanged(gl: GL10?, width: Int, height: Int) {
    Log.d(TAG, "onSurfaceChanged(...)")
    surfaceTexture?.setOutputSize(Size(width, height))
  }

  override fun onDrawFrame(gl: GL10?) {
    Log.d(TAG, "onDrawFrame(...)")
    surfaceTexture?.updateTexImage()
  }

}
