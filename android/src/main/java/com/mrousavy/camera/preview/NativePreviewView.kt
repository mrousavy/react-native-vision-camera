package com.mrousavy.camera.preview

import android.content.Context
import android.view.Surface
import android.view.SurfaceHolder
import android.view.SurfaceView
import android.view.TextureView
import com.mrousavy.camera.frameprocessor.Frame

class NativePreviewView(context: Context): PreviewView(context) {
  private val surfaceView = SurfaceView(context)

  override fun drawFrame(frame: Frame) {
    // TODO: Draw Frame
  }

  init {
    addView(surfaceView)
  }

  // TODO: Do we need to remove the listener at any point?
  override fun addOnSurfaceChangedListener(callback: (surface: Surface?) -> Unit) {
    surfaceView.holder.setFixedSize(300, 300)
    surfaceView.holder.addCallback(object : SurfaceHolder.Callback {
      override fun surfaceCreated(holder: SurfaceHolder) {
      }

      override fun surfaceDestroyed(holder: SurfaceHolder) {
      }

      override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
        if (holder.surface != null && width > 0 && height > 0) {
          callback(holder.surface)
        } else {
          callback(null)
        }
      }
    })
  }
}
