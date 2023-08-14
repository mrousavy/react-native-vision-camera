package com.mrousavy.camera.skia

import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
import android.view.Choreographer
import android.view.SurfaceHolder
import android.view.SurfaceView
import com.mrousavy.camera.extensions.postAndWait

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
      Log.i(TAG, "onSurfaceCreated(..)")

      skiaRenderer.thread.postAndWait {
        // Create C++ part (OpenGL/Skia context)
        skiaRenderer.setPreviewSurface(holder.surface)
        isAlive = true

        // Start updating the Preview View (~60 FPS)
        startLooping(Choreographer.getInstance())
      }
    }
  }

  override fun surfaceChanged(holder: SurfaceHolder, format: Int, w: Int, h: Int) {
    synchronized(this) {
      Log.i(TAG, "surfaceChanged($w, $h)")

      skiaRenderer.thread.postAndWait {
        // Update C++ OpenGL Surface size
        skiaRenderer.setPreviewSurfaceSize(w, h)
      }
    }
  }

  override fun surfaceDestroyed(holder: SurfaceHolder) {
    synchronized(this) {
      isAlive = false
      Log.i(TAG, "surfaceDestroyed(..)")

      skiaRenderer.thread.postAndWait {
        // Clean up C++ part (OpenGL/Skia context)
        skiaRenderer.destroyPreviewSurface()
      }
    }
  }
}
