package com.mrousavy.camera.preview

import android.content.Context
import android.graphics.SurfaceTexture
import android.opengl.GLES20
import android.opengl.GLSurfaceView
import android.util.Log
import android.view.Surface
import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10

@Suppress("KotlinJniMissingFunction")
class SkiaPreviewView(context: Context): GLSurfaceView(context), GLSurfaceView.Renderer {
  companion object {
    private const val OPEN_GL_VERSION = 2
    private const val TAG = "SkiaPreviewView"
  }

  @DoNotStrip
  private var mHybridData: HybridData? = null
  private var inputTexture: SurfaceTexture? = null

  init {
    setEGLContextClientVersion(OPEN_GL_VERSION)
    setRenderer(this)
    renderMode = RENDERMODE_WHEN_DIRTY
  }

  override fun finalize() {
    super.finalize()
    inputTexture?.release()
  }

  private external fun initHybrid(): HybridData
  private external fun createSurface(width: Int, height: Int): Int
  private external fun onSizeChanged(width: Int, height: Int)
  private external fun onDrawFrame()

  override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
    mHybridData = initHybrid()
    repeat(5) {
      Log.d(TAG, "onSurfaceCreated()")
      val textureId = createSurface(400, 700)
      val surfaceTexture = SurfaceTexture(textureId)
      val surface = Surface(surfaceTexture)
      Log.d(TAG, "SurfaceTexture created! isValid: " + surface.isValid)
    }
  }

  override fun onSurfaceChanged(gl: GL10?, width: Int, height: Int) {
    Log.d(TAG, "onSurfaceChanged()")
  }

  override fun onDrawFrame(gl: GL10?) {
    Log.d(TAG, "onDrawFrame()")
  }

}
