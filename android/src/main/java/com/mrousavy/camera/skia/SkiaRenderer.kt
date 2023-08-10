package com.mrousavy.camera.skia

import android.graphics.SurfaceTexture
import android.view.Surface
import com.facebook.jni.HybridClassBase
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip

@Suppress("KotlinJniMissingFunction")
class SkiaRenderer: HybridClassBase() {
  data class InputTexture(val textureId: Int, val surfaceTexture: SurfaceTexture, val surface: Surface)

  @DoNotStrip
  private var mHybridData: HybridData
  private var hasNewFrame = false
  private val inputTexture: InputTexture

  val inputSurface: Surface
    get() = inputTexture.surface

  init {
      mHybridData = initHybrid()

    // Create Java part (Surface)
    val textureId = getInputTexture()
    val surfaceTexture = SurfaceTexture(textureId)
    surfaceTexture.setOnFrameAvailableListener { texture ->
      texture.updateTexImage()
      hasNewFrame = true
      renderCameraFrameToOffscreenCanvas()
    }
    val surface = Surface(surfaceTexture)
    inputTexture = InputTexture(textureId, surfaceTexture, surface)
  }

  external fun setPreviewSurface(surface: Any)
  external fun setPreviewSurfaceSize(width: Int, height: Int)
  external fun destroyPreviewSurface()

  fun onPreviewFrame() {
    if (!hasNewFrame) return
    renderLatestFrameToPreview()
  }

  private external fun initHybrid(): HybridData

  private external fun getInputTexture(): Int
  private external fun renderCameraFrameToOffscreenCanvas()
  private external fun renderLatestFrameToPreview()
}
