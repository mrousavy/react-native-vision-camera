package com.mrousavy.camera.skia

import android.content.Context
import android.graphics.SurfaceTexture
import android.opengl.EGL14
import android.opengl.GLES11Ext
import android.opengl.GLES20
import android.opengl.GLSurfaceView
import android.util.Log
import android.view.Surface
import android.view.SurfaceHolder
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import java.io.Closeable
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import java.nio.IntBuffer
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL
import javax.microedition.khronos.opengles.GL10

@Suppress("KotlinJniMissingFunction")
class SkiaPreviewView(context: Context,
                      private val onSurfaceChanged: (surface: Surface?) -> Unit): GLSurfaceView(context), GLSurfaceView.Renderer, Closeable {
  companion object {
    private val TAG = "SkiaPreviewView"
  }

  @DoNotStrip
  private var mHybridData: HybridData

  data class InputTexture(val textureId: Int, val surfaceTexture: SurfaceTexture, val surface: Surface)

  private var inputTexture: InputTexture? = null

  init {
    Log.i(TAG, "Initializing SkiaPreviewView...")
    mHybridData = initHybrid()
    setEGLContextClientVersion(2)
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

  override fun onSurfaceCreated(gl: GL10, config: EGLConfig?) {
    destroyInputTexture(gl)

    Log.i(TAG, "onSurfaceCreated(OpenGL)")
    val textures = IntBuffer.allocate(1)
    gl.glGenTextures(1, textures)

    val textureId = textures[0]
    val surfaceTexture = SurfaceTexture(textureId)
    surfaceTexture.setDefaultBufferSize(1280, 720)
    surfaceTexture.setOnFrameAvailableListener { s ->
      // CAMERA - Drawing at 1..240 FPS
      Log.i(TAG, "onFrameAvailable(..)")
      // TODO: 1. s.updateTexImage()
      // TODO: 2. call Skia Frame Processor
    }
    val surface = Surface(surfaceTexture)
    onSurfaceChanged(surface)
    inputTexture = InputTexture(textureId, surfaceTexture, surface)

    onSurfaceCreated()
  }

  override fun onSurfaceChanged(gl: GL10?, width: Int, height: Int) {
    Log.i(TAG, "onSurfaceChanged($width, $height)")
    setSurfaceSize(width, height)
  }

  override fun onDrawFrame(gl: GL10) {
    // PREVIEW - Drawing at 60 FPS
    Log.i(TAG, "onDrawFrame(..)")
    val inputTexture = inputTexture ?: return

    gl.glClearColor(1f, 0f, 0f, 1f)
    gl.glClear(GLES20.GL_COLOR_BUFFER_BIT)

    inputTexture.surfaceTexture.updateTexImage()

    onDrawFrame(inputTexture.textureId, 1280, 720)
  }

  private fun destroyInputTexture(gl: GL10? = null) {
    val inputTexture = inputTexture ?: return

    inputTexture.surface.release()
    inputTexture.surfaceTexture.release()
    gl?.glDeleteTextures(1, intArrayOf(inputTexture.textureId), 0)
  }

  override fun close() {
    destroyInputTexture()
    destroy()
  }

  private external fun initHybrid(): HybridData
  private external fun destroy()

  private external fun onDrawFrame(textureId: Int, textureWidth: Int, textureHeight: Int)
  private external fun setSurfaceSize(surfaceWidth: Int, surfaceHeight: Int)
  private external fun onSurfaceCreated()
}
