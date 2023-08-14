package com.mrousavy.camera.skia

import android.graphics.ImageFormat
import android.view.Surface
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.mrousavy.camera.CameraQueues
import com.mrousavy.camera.frameprocessor.Frame
import java.io.Closeable
import java.nio.ByteBuffer

@Suppress("KotlinJniMissingFunction")
class SkiaRenderer: Closeable {
  @DoNotStrip
  private var mHybridData: HybridData
  private var hasNewFrame = false
  private var hasOutputSurface = false

  val thread = CameraQueues.previewQueue.handler

  init {
    mHybridData = initHybrid()
  }

  override fun close() {
    hasNewFrame = false
    thread.post {
      synchronized(this) {
        destroyOutputSurface()
        mHybridData.resetNative()
      }
    }
  }

  fun setPreviewSurface(surface: Surface) {
    synchronized(this) {
      setOutputSurface(surface)
      hasOutputSurface = true
    }
  }

  fun setPreviewSurfaceSize(width: Int, height: Int) {
    synchronized(this) {
      setOutputSurfaceSize(width, height)
    }
  }

  fun destroyPreviewSurface() {
    synchronized(this) {
      destroyOutputSurface()
      hasOutputSurface = false
    }
  }

  fun setInputSurfaceSize(width: Int, height: Int) {
    synchronized(this) {
      setInputTextureSize(width, height)
    }
  }

  /**
   * Called on every Camera Frame (1..240 FPS)
   */
  fun onCameraFrame(frame: Frame) {
    synchronized(this) {
      if (!hasOutputSurface) return
      if (frame.image.format != ImageFormat.YUV_420_888) {
        throw Error("Failed to render Camera Frame! Expected Image format #${ImageFormat.YUV_420_888} (ImageFormat.YUV_420_888), received #${frame.image.format}.")
      }
      val (y, u, v) = frame.image.planes
      renderCameraFrameToOffscreenCanvas(y.buffer, u.buffer, v.buffer)
      hasNewFrame = true
    }
  }

  /**
   * Called on every UI Frame (60 FPS)
   */
  fun onPreviewFrame() {
    synchronized(this) {
      if (!hasOutputSurface) return
      if (!hasNewFrame) return
      renderLatestFrameToPreview()
      hasNewFrame = false
    }
  }

  private external fun initHybrid(): HybridData

  private external fun renderCameraFrameToOffscreenCanvas(yBuffer: ByteBuffer,
                                                          uBuffer: ByteBuffer,
                                                          vBuffer: ByteBuffer)
  private external fun renderLatestFrameToPreview()
  private external fun setInputTextureSize(width: Int, height: Int)
  private external fun setOutputSurface(surface: Any)
  private external fun setOutputSurfaceSize(width: Int, height: Int)
  private external fun destroyOutputSurface()
}
