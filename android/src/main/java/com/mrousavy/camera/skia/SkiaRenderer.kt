package com.mrousavy.camera.skia

import android.graphics.SurfaceTexture
import android.os.Build
import android.view.Surface
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.mrousavy.camera.CameraError
import com.mrousavy.camera.UnknownCameraError

@Suppress("KotlinJniMissingFunction")
class SkiaRenderer {
  data class InputTexture(val surfaceTexture: SurfaceTexture, val surface: Surface)

  @DoNotStrip
  private var mHybridData: HybridData
  private var hasNewFrame = false
  private val inputTexture: InputTexture
  private var didAttachInputTextureToOpenGL = false

  val inputSurface: Surface
    get() = inputTexture.surface

  init {
    mHybridData = initHybrid()

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      throw Error("VisionCamera Skia integration is only available on Android API 26 and above!")
    }

    val surfaceTexture = SurfaceTexture(false)
    surfaceTexture.setOnFrameAvailableListener { texture ->
      if (!didAttachInputTextureToOpenGL) return@setOnFrameAvailableListener
      texture.updateTexImage()
      renderCameraFrameToOffscreenCanvas()
      hasNewFrame = true
    }
    val surface = Surface(surfaceTexture)
    inputTexture = InputTexture(surfaceTexture, surface)
  }

  external fun setPreviewSurface(surface: Any)
  external fun setPreviewSurfaceSize(width: Int, height: Int)
  external fun destroyPreviewSurface()

  fun onPreviewFrame() {
    if (!didAttachInputTextureToOpenGL) {
      val glTextureId = prepareInputTexture()
      inputTexture.surfaceTexture.attachToGLContext(glTextureId)
      didAttachInputTextureToOpenGL = true
    }
    if (!hasNewFrame) return
    renderLatestFrameToPreview()
    hasNewFrame = false
  }

  private external fun initHybrid(): HybridData

  private external fun renderCameraFrameToOffscreenCanvas()
  private external fun renderLatestFrameToPreview()
  private external fun prepareInputTexture(): Int
}
