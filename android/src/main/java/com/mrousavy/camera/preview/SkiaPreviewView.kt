package com.mrousavy.camera.preview

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.SurfaceTexture
import android.opengl.GLES20
import android.opengl.GLSurfaceView
import android.util.Log
import android.util.Size
import android.view.Surface
import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10
import kotlin.coroutines.CoroutineContext
import kotlin.coroutines.coroutineContext
import kotlin.coroutines.suspendCoroutine

@Suppress("KotlinJniMissingFunction")
class SkiaPreviewView(context: Context): GLSurfaceView(context), GLSurfaceView.Renderer {
  companion object {
    private const val OPEN_GL_VERSION = 2
    private const val TAG = "SkiaPreviewView"
  }

  @DoNotStrip
  private val mHybridData: HybridData
  var previewSurface: SkiaPreviewSurface? = null

  init {
    mHybridData = initHybrid()
    setEGLContextClientVersion(OPEN_GL_VERSION)
    setRenderer(this)
    renderMode = RENDERMODE_WHEN_DIRTY
  }

  override fun finalize() {
    super.finalize()
    previewSurface?.release()
  }

  private external fun initHybrid(): HybridData
  private external fun onSizeChanged(width: Int, height: Int)
  private external fun onDrawFrame()

  override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
    Log.d(TAG, "onSurfaceCreated()")
    previewSurface = SkiaPreviewSurface(Size(400, 700), Surface(SurfaceTexture(0)))
  }

  override fun onSurfaceChanged(gl: GL10?, width: Int, height: Int) {
    Log.d(TAG, "onSurfaceChanged()")
    previewSurface?.setOutputSize(Size(width, height))
  }

  override fun onDrawFrame(gl: GL10?) {
    Log.d(TAG, "onDrawFrame()")
  }

}
