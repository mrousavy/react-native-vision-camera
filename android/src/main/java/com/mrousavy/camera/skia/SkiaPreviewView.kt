package com.mrousavy.camera.skia

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.PorterDuff
import android.util.Log
import android.view.Surface
import android.view.SurfaceHolder
import android.view.SurfaceView
import android.widget.FrameLayout
import androidx.camera.core.ImageProxy
import com.mrousavy.camera.utils.toBitmap

class SkiaPreviewView(context: Context) : FrameLayout(context), SurfaceHolder.Callback {
  private val TAG = "SkiaPreviewView"
  val surfaceView = SurfaceView(context)
  val surface: Surface?
    get() {
      if (surfaceView.holder.isCreating) {
        return null
      }
      return surfaceView.holder.surface
    }

  val bitmap: Bitmap?
    get() {
      // TODO: Implement Bitmap!!
      return null
    }

  init {
    surfaceView.holder.addCallback(this)
    surfaceView.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    addView(surfaceView)
  }

  override fun surfaceCreated(holder: SurfaceHolder) {
    Log.i(TAG, "Surface Created!")
  }

  override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
    Log.i(TAG, "Surface Changed!")
  }

  override fun surfaceDestroyed(holder: SurfaceHolder) {
    Log.i(TAG, "Surface Destroyed!")
  }

  fun drawImage(image: ImageProxy) {
    val bitmap = image.toBitmap()

    // get & prepare canvas
    val canvas = surfaceView.holder.lockCanvas()
    // clear canvas
    canvas.drawColor(Color.BLACK, PorterDuff.Mode.CLEAR)
    canvas.drawBitmap(bitmap, 0f, 0f, null)
    // TODO: Use Skia to draw the remaining operations here
    // flush & submit
    surfaceView.holder.unlockCanvasAndPost(canvas)
  }
}
