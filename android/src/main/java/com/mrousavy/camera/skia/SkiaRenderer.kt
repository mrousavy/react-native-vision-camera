package com.mrousavy.camera.skia

import android.graphics.SurfaceTexture
import android.os.Build
import android.os.Looper
import android.util.Log
import android.view.Surface
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.mrousavy.camera.CameraError
import com.mrousavy.camera.CameraQueues
import com.mrousavy.camera.UnknownCameraError
import java.io.Closeable
import java.lang.RuntimeException
import java.util.concurrent.locks.ReentrantLock

@Suppress("KotlinJniMissingFunction")
class SkiaRenderer: Closeable {
  companion object {
    private const val TAG = "SkiaRenderer"
  }
  data class InputTexture(var isAttached: Boolean, val surfaceTexture: SurfaceTexture, val surface: Surface)

  @DoNotStrip
  private var mHybridData: HybridData
  private var hasNewFrame = false
  private val inputTexture: InputTexture

  val inputSurface: Surface
    get() = inputTexture.surface

  val thread = CameraQueues.previewQueue.handler

  init {
    mHybridData = initHybrid()

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      throw Error("VisionCamera Skia integration is only available on Android API 26 and above!")
    }

    val surfaceTexture = SurfaceTexture(false)
    surfaceTexture.setOnFrameAvailableListener({ texture ->
      onCameraFrame(texture)
    }, thread)
    val surface = Surface(surfaceTexture)
    inputTexture = InputTexture(false, surfaceTexture, surface)
  }

  override fun close() {
    hasNewFrame = false
    thread.post {
      synchronized(this) {
        if (inputTexture.isAttached) detachInputTexture()
        inputTexture.surface.release()
        inputTexture.surfaceTexture.release()
        destroyOutputSurface()
        mHybridData.resetNative()
      }
    }
  }

  fun setPreviewSurface(surface: Surface) {
    synchronized(this) {
      if (inputTexture.isAttached) detachInputTexture()
      setOutputSurface(surface)
    }
  }

  fun setPreviewSurfaceSize(width: Int, height: Int) {
    synchronized(this) {
      setOutputSurfaceSize(width, height)
    }
  }

  fun destroyPreviewSurface() {
    synchronized(this) {
      if (inputTexture.isAttached) detachInputTexture()
      destroyOutputSurface()
    }
  }

  /**
   * Called on every Camera Frame (1..240 FPS)
   */
  private fun onCameraFrame(texture: SurfaceTexture) {
    synchronized(this) {
      if (!inputTexture.isAttached) return
      texture.updateTexImage()
      renderCameraFrameToOffscreenCanvas()
      hasNewFrame = true
    }
  }

  /**
   * Called on every UI Frame (60 FPS)
   */
  fun onPreviewFrame() {
    synchronized(this) {
      if (!inputTexture.isAttached) attachInputTexture()
      renderLatestFrameToPreview()
      hasNewFrame = false
    }
  }

  private fun detachInputTexture() {
    Log.i(TAG, "Detaching input Surface from OpenGL Context...")
    inputTexture.surfaceTexture.detachFromGLContext()
    inputTexture.isAttached = false
  }

  private fun attachInputTexture() {
    Log.i(TAG, "Attaching input Surface to OpenGL Context...")
    val glTextureId = prepareInputTexture()
    inputTexture.surfaceTexture.attachToGLContext(glTextureId)
    inputTexture.isAttached = true
  }

  private external fun initHybrid(): HybridData

  private external fun renderCameraFrameToOffscreenCanvas()
  private external fun renderLatestFrameToPreview()
  private external fun prepareInputTexture(): Int
  private external fun setOutputSurface(surface: Any)
  private external fun setOutputSurfaceSize(width: Int, height: Int)
  private external fun destroyOutputSurface()
}
