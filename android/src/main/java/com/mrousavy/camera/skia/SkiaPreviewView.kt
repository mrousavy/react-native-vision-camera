package com.mrousavy.camera.skia

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.SurfaceTexture
import android.opengl.EGL14
import android.opengl.GLES11Ext
import android.opengl.GLES20
import android.opengl.GLSurfaceView
import android.os.HandlerThread
import android.util.Log
import android.view.Choreographer
import android.view.Surface
import android.view.SurfaceHolder
import android.view.SurfaceView
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.mrousavy.camera.CameraQueues
import java.io.Closeable
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import java.nio.IntBuffer
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL
import javax.microedition.khronos.opengles.GL10

@SuppressLint("ViewConstructor")
@Suppress("KotlinJniMissingFunction")
class SkiaPreviewView(context: Context,
                      private val onSurfaceChanged: (surface: Surface?) -> Unit) :
  SurfaceView(context), SurfaceHolder.Callback, Closeable {
  companion object {
    private val TAG = "SkiaPreviewView"
  }

  data class InputTexture(val textureId: Int, val surfaceTexture: SurfaceTexture, val surface: Surface)

  @DoNotStrip
  private var mHybridData: HybridData
  private var inputTexture: InputTexture? = null
  private var isAlive = true
  private val thread = CameraQueues.previewQueue.handler

  init {
    Log.i(TAG, "Initializing SkiaPreviewView...")
    mHybridData = initHybrid()
    holder.addCallback(this)
  }

  override fun close() {
    isAlive = false
    destroy()
  }

  /**
   * Re-renders the Preview View UI (60 FPS)
   */
  private fun onPreviewFrame() {
    Log.i(TAG, "Render new Frame for Preview UI!")
  }

  /**
   * Renders a new Camera Frame (1..240 FPS)
   */
  private fun onCameraFrame(texture: SurfaceTexture) {
    Log.i(TAG, "New Frame arrived from Camera!")
    texture.updateTexImage()
  }

  private fun startLooping(choreographer: Choreographer) {
    choreographer.postFrameCallback {
      if (isAlive) onPreviewFrame()
      startLooping(choreographer)
    }
  }

  override fun surfaceCreated(holder: SurfaceHolder) {
    isAlive = true
    Log.i(TAG, "onSurfaceCreated(..)")
    // Create C++ part (OpenGL/Skia context)
    onSurfaceCreated()
    // Create Java part (Surface)
    val textureId = createTexture()
    val surfaceTexture = SurfaceTexture(textureId)
    surfaceTexture.setOnFrameAvailableListener { texture -> onCameraFrame(texture) }
    val surface = Surface(surfaceTexture)
    inputTexture = InputTexture(textureId, surfaceTexture, surface)
    // Notify Camera that we now have a Surface - Camera will start writing Frames
    onSurfaceChanged(surface)

    // Start updating the Preview View (~60 FPS)
    this.thread.post {
      startLooping(Choreographer.getInstance())
    }
  }

  override fun surfaceDestroyed(holder: SurfaceHolder) {
    isAlive = false
    Log.i(TAG, "surfaceDestroyed(..)")
    // Notify Camera that we no longer have a Surface - Camera will stop writing Frames
    onSurfaceChanged(null)
    // Clean up C++ part (OpenGL/Skia context)
    onSurfaceDestroyed()
    // Clean up Java part (Surface)
    inputTexture?.surface?.release()
    inputTexture?.surfaceTexture?.release()
    inputTexture = null
  }

  override fun surfaceChanged(holder: SurfaceHolder, format: Int, w: Int, h: Int) {
    Log.i(TAG, "surfaceChanged($w, $h)")
    onSurfaceResized(w, h)
  }

  /*
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
   */

  private external fun initHybrid(): HybridData
  private external fun destroy()

  private external fun onDrawFrame(textureId: Int, textureWidth: Int, textureHeight: Int)
  private external fun onSurfaceCreated()
  private external fun onSurfaceResized(surfaceWidth: Int, surfaceHeight: Int)
  private external fun onSurfaceDestroyed()
  private external fun createTexture(): Int
}
