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
  private val previewStreamSize: Size

  init {
    Log.i(TAG, "Initializing SkiaPreviewView...")
    mHybridData = initHybrid()
    holder.addCallback(this)

    val cameraCharacteristics = cameraManager.getCameraCharacteristics(cameraId)
    previewStreamSize = cameraCharacteristics.getPreviewSize(ImageFormat.YUV_420_888)
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
    surfaceTexture.setDefaultBufferSize(previewStreamSize.width, previewStreamSize.height)
    surfaceTexture.setOnFrameAvailableListener { texture -> onCameraFrame(texture) }
    val surface = Surface(surfaceTexture)
    inputTexture = InputTexture(textureId, surfaceTexture, surface)
    // Notify Camera that we now have a Surface - Camera will start writing Frames
    onSurfaceChanged(surface)

    // Start updating the Preview View (~60 FPS)
    thread.post {
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

  private external fun initHybrid(): HybridData
  private external fun destroy()

  private external fun onDrawFrame(textureId: Int, textureWidth: Int, textureHeight: Int)
  private external fun onSurfaceCreated()
  private external fun onSurfaceResized(surfaceWidth: Int, surfaceHeight: Int)
  private external fun onSurfaceDestroyed()
  private external fun createTexture(): Int
}
