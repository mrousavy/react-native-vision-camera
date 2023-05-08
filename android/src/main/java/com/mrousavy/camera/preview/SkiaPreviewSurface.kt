package com.mrousavy.camera.preview

import android.graphics.ImageFormat
import android.graphics.SurfaceTexture
import android.hardware.HardwareBuffer
import android.media.Image
import android.media.ImageReader
import android.util.Log
import android.util.Size
import android.view.Surface
import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import com.mrousavy.camera.frameprocessor.Frame

@Suppress("KotlinJniMissingFunction")
class SkiaPreviewSurface(inputSurfaceWidth: Int, inputSurfaceHeight: Int) {
  companion object {
    private const val OPEN_GL_VERSION = 2
    private const val TAG = "SkiaPreviewSurface"
  }

  @DoNotStrip
  private val mHybridData: HybridData
  val imageReader: ImageReader

  init {
    imageReader = ImageReader.newInstance(inputSurfaceWidth, inputSurfaceHeight, ImageFormat.YUV_420_888, 3)
    imageReader.setOnImageAvailableListener({ reader ->
      val image = reader.acquireLatestImage()
      Log.d(TAG, "Frame: ${image.width} x ${image.height}")
      val timestamp = System.currentTimeMillis()
      onFrame(Frame(image, Frame.Orientation.PORTRAIT, false, timestamp))
      image.close()
    }, null)
    mHybridData = initHybrid(imageReader.surface, inputSurfaceWidth, inputSurfaceHeight)
  }

  fun release() {
    mHybridData.resetNative()
    imageReader.close()
  }

  fun setOutputSize(size: Size) {
    setOutputSize(size.width, size.height)
  }

  private external fun initHybrid(inputSurface: Any, inputWidth: Int, inputHeight: Int): HybridData
  private external fun setOutputSize(width: Int, height: Int)
  private external fun onFrame(frame: Frame)
  external fun setOutputSurface(surface: Any)
}
