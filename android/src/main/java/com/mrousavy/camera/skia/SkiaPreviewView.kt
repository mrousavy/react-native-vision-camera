package com.mrousavy.camera.skia

import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
import android.view.Choreographer
import android.view.Surface
import android.view.SurfaceHolder
import android.view.SurfaceView
import com.mrousavy.camera.CameraQueues

@SuppressLint("ViewConstructor")
class SkiaPreviewView(context: Context,
                      private val skiaRenderer: SkiaRenderer): SurfaceView(context), SurfaceHolder.Callback {
  companion object {
    private const val TAG = "SkiaPreviewView"
  }

  private var isAlive = true

  init {
    holder.addCallback(this)
  }

  private fun startLooping(choreographer: Choreographer) {
    choreographer.postFrameCallback {
      synchronized(this) {
        if (!isAlive) return@synchronized

        Log.i(TAG, "tick..")

        // Refresh UI (60 FPS)
        skiaRenderer.onPreviewFrame()
        startLooping(choreographer)
      }
    }
  }

  override fun surfaceCreated(holder: SurfaceHolder) {
    synchronized(this) {
      isAlive = true
      Log.i(TAG, "onSurfaceCreated(..)")

      skiaRenderer.thread.post {
        // Create C++ part (OpenGL/Skia context)
        skiaRenderer.setPreviewSurface(holder.surface)

        // Start updating the Preview View (~60 FPS)
        startLooping(Choreographer.getInstance())
      }
    }
  }

  override fun surfaceChanged(holder: SurfaceHolder, format: Int, w: Int, h: Int) {
    Log.i(TAG, "surfaceChanged($w, $h)")

    skiaRenderer.thread.post {
      // Update C++ OpenGL Surface size
      skiaRenderer.setPreviewSurfaceSize(w, h)
    }
  }

  override fun surfaceDestroyed(holder: SurfaceHolder) {
    synchronized(this) {
      isAlive = false
      Log.i(TAG, "surfaceDestroyed(..)")

      skiaRenderer.thread.post {
        // Clean up C++ part (OpenGL/Skia context)
        skiaRenderer.destroyPreviewSurface()
      }
    }
  }
}
