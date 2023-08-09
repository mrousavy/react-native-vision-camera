package com.mrousavy.camera.skia

import android.content.Context
import android.graphics.SurfaceTexture
import android.opengl.EGL14
import android.opengl.GLSurfaceView
import android.util.Log
import android.view.Surface
import android.view.SurfaceHolder
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import java.io.Closeable
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10

@Suppress("KotlinJniMissingFunction")
class SkiaPreviewView(context: Context): GLSurfaceView(context), GLSurfaceView.Renderer, Closeable {
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
    Log.i(TAG, "Preview Textured created: $textureId")
    surfaceTexture = SurfaceTexture(textureId)
    surface = Surface(surfaceTexture)
    surfaceTexture.updateTexImage()

    setRenderer(this)
  }

  override fun surfaceCreated(holder: SurfaceHolder) {
    super.surfaceCreated(holder)
    Log.i(TAG, "onSurfaceCreated(..)")
  }

  override fun surfaceDestroyed(holder: SurfaceHolder) {
    super.surfaceDestroyed(holder)
    Log.i(TAG, "surfaceDestroyed(..)")
  }

  override fun surfaceChanged(holder: SurfaceHolder, format: Int, w: Int, h: Int) {
    super.surfaceChanged(holder, format, w, h)
    Log.i(TAG, "surfaceChanged($w, $h)")
  }

  override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
    Log.i(TAG, "onSurfaceCreated(OpenGL)")
  }

  override fun onSurfaceChanged(gl: GL10?, width: Int, height: Int) {
    Log.i(TAG, "onSurfaceChanged($width, $height)")
  }

  override fun onDrawFrame(gl: GL10) {
    Log.i(TAG, "onDrawFrame(..)")
    onDrawFrame()
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

  private external fun onDrawFrame()
}
