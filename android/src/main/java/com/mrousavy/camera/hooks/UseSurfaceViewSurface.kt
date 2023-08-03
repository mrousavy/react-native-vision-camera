package com.mrousavy.camera.hooks

import android.util.Log
import android.view.Surface
import android.view.SurfaceHolder
import android.view.SurfaceView
import java.io.Closeable

class UseSurfaceViewSurface(private val surfaceView: SurfaceView,
                            onChange: (surface: Surface?) -> Unit): Closeable, DataProvider<Surface>(onChange) {
  companion object {
    private const val TAG = "UseSurfaceViewSurface"
  }

  private val surfaceCallback = object: SurfaceHolder.Callback {
    override fun surfaceCreated(holder: SurfaceHolder) {
      Log.d(TAG, "Surface Created: ${holder.surface}")
      update(holder.surface)
    }

    override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
      Log.d(TAG, "Surface resized: ${holder.surface} $format $width x $height")
    }

    override fun surfaceDestroyed(holder: SurfaceHolder) {
      Log.d(TAG, "Surface Destroyed: ${holder.surface}")
      update(null)
    }
  }

  init {
    surfaceView.holder.addCallback(surfaceCallback)
  }

  override fun close() {
    surfaceView.holder.removeCallback(surfaceCallback)
  }
}
