package com.mrousavy.camera.preview

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.SurfaceTexture
import android.opengl.GLES20
import android.opengl.GLSurfaceView
import android.util.Log
import android.util.Size
import android.view.Surface
import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10
import kotlin.coroutines.CoroutineContext
import kotlin.coroutines.coroutineContext
import kotlin.coroutines.suspendCoroutine

@Suppress("KotlinJniMissingFunction")
class SkiaPreviewSurface(inputSize: Size, outputSurface: Surface) {
  companion object {
    private const val OPEN_GL_VERSION = 2
    private const val TAG = "SkiaPreviewSurface"
  }

  @DoNotStrip
  private val mHybridData: HybridData

  val inputSurface: SurfaceTexture

  init {
    mHybridData = initHybrid(inputSize.width, inputSize.height, outputSurface)
    val inputSurfaceId = getInputSurfaceTextureId()
    inputSurface = SurfaceTexture(inputSurfaceId)
    inputSurface.setDefaultBufferSize(inputSize.width, inputSize.height)
  }

  fun release() {
    mHybridData.resetNative()
    inputSurface.release()
  }

  fun setOutputSize(size: Size) {
    setOutputSize(size.width, size.height)
  }

  private external fun initHybrid(inputWidth: Int, inputHeight: Int, outputSurface: Any): HybridData
  private external fun setOutputSize(width: Int, height: Int)
  private external fun getInputSurfaceTextureId(): Int
  external fun drawFrame()
}
