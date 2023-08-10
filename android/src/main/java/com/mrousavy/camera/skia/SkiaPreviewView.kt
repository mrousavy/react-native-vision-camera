package com.mrousavy.camera.skia

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.ImageFormat
import android.graphics.SurfaceTexture
import android.hardware.camera2.CameraManager
import android.util.Log
import android.util.Size
import android.view.Choreographer
import android.view.Surface
import android.view.SurfaceHolder
import android.view.SurfaceView
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.mrousavy.camera.CameraQueues
import com.mrousavy.camera.extensions.getPreviewSize
import java.io.Closeable

@SuppressLint("ViewConstructor")
@Suppress("KotlinJniMissingFunction")
class SkiaPreviewView(context: Context,
                      cameraManager: CameraManager,
                      cameraId: String,
                      private val onSurfaceChanged: (surface: Surface?) -> Unit) :
  SurfaceView(context), SurfaceHolder.Callback, Closeable {
  companion object {
    private const val TAG = "SkiaPreviewView"
  }

  data class InputTexture(val textureId: Int, val surfaceTexture: SurfaceTexture, val surface: Surface)

  @DoNotStrip
  private var mHybridData: HybridData
  private var inputTexture: InputTexture? = null
  private var isAlive = true
  private val thread = CameraQueues.previewQueue.handler
  private var hasNewFrame = false

  init {
    Log.i(TAG, "Initializing SkiaPreviewView...")
    mHybridData = initHybrid()
    holder.addCallback(this)
  }

  override fun close() {
    isAlive = false
    destroy()
  }

  private fun startLooping(choreographer: Choreographer) {
    choreographer.postFrameCallback {
      if (isAlive && hasNewFrame) {
        onPreviewFrame()
        hasNewFrame = false
      }
      startLooping(choreographer)
    }
  }

  override fun surfaceCreated(holder: SurfaceHolder) {
    isAlive = true
    Log.i(TAG, "onSurfaceCreated(..)")
    // Create C++ part (OpenGL/Skia context)
    onSurfaceCreated(holder.surface)
    // Create Java part (Surface)
    val textureId = createTexture()
    val surfaceTexture = SurfaceTexture(textureId)
    surfaceTexture.setOnFrameAvailableListener { texture ->
      texture.updateTexImage()
      hasNewFrame = true
      onCameraFrame()
    }
    val surface = Surface(surfaceTexture)
    inputTexture = InputTexture(textureId, surfaceTexture, surface)
    // Notify Camera that we now have a Surface - Camera will start writing Frames
    onSurfaceChanged(surface)

    // Start updating the Preview View (~60 FPS)
    thread.post {
      startLooping(Choreographer.getInstance())
    }
  }

  override fun surfaceChanged(holder: SurfaceHolder, format: Int, w: Int, h: Int) {
    Log.i(TAG, "surfaceChanged($w, $h)")
    onSurfaceResized(w, h)
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

  private external fun initHybrid(): HybridData
  private external fun destroy()

  /**
   * Creates an OpenGL Texture for the Camera to stream Frames into
   */
  private external fun createTexture(): Int

  /**
   * Re-renders the Preview View UI (60 FPS)
   */
  private external fun onPreviewFrame()

  /**
   * Renders a new Camera Frame (1..240 FPS)
   */
  private external fun onCameraFrame()
  private external fun onSurfaceCreated(surface: Any)
  private external fun onSurfaceResized(surfaceWidth: Int, surfaceHeight: Int)
  private external fun onSurfaceDestroyed()
}
