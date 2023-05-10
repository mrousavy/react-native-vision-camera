package com.mrousavy.camera.preview

import android.content.Context
import android.graphics.ImageFormat
import android.graphics.SurfaceTexture
import android.media.ImageReader
import android.opengl.GLES20.glGenTextures
import android.opengl.GLSurfaceView
import android.os.Build
import android.util.Log
import android.util.Size
import android.view.Choreographer
import android.view.Surface
import android.view.SurfaceHolder
import android.view.SurfaceView
import android.view.TextureView
import android.view.TextureView.SurfaceTextureListener
import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import com.mrousavy.camera.frameprocessor.Frame
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10

@Suppress("KotlinJniMissingFunction")
class SkiaPreviewView(context: Context): TextureView(context), SurfaceTextureListener {
  companion object {
    private const val TAG = "SkiaPreviewView"
  }

  @DoNotStrip
  private val mHybridData: HybridData
  private var imageReader: ImageReader

  var outputSurface: SurfaceTexture? = null
  var outputSize: Size? = null
  val surface: Surface
    get () {
      return imageReader.surface
    }

  init {
    mHybridData = initHybrid()

    this.surfaceTextureListener = this

    imageReader = ImageReader.newInstance(480, 640, ImageFormat.YUV_420_888, 3)
    imageReader.setOnImageAvailableListener({
      val image = imageReader.acquireLatestImage()

      Log.d(TAG, "Image ${image.width} x ${image.height}")
      onFrame(Frame(image, Frame.Orientation.PORTRAIT, false, image.timestamp))
      image.close()
    }, null)

    setInputSurface(imageReader.surface)
  }

  private external fun initHybrid(): HybridData
  private external fun onSizeChanged(width: Int, height: Int)
  private external fun setInputSurface(surface: Any)
  private external fun setOutputSurface(surface: Any)
  private external fun onFrame(frame: Frame)

  override fun onSurfaceTextureAvailable(surface: SurfaceTexture, width: Int, height: Int) {
    this.outputSurface = surface
    setOutputSurface(Surface(this.outputSurface))
  }

  override fun onSurfaceTextureSizeChanged(surface: SurfaceTexture, width: Int, height: Int) {
    this.outputSize = Size(width, height)
    onSizeChanged(width, height)
  }

  override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
    this.outputSurface = null
    return false
  }

  override fun onSurfaceTextureUpdated(surface: SurfaceTexture) {

  }

}
