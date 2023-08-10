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
                      private val skiaRenderer: SkiaRenderer,
                      private val onSurfaceChanged: (surface: Surface?) -> Unit): SurfaceView(context), SurfaceHolder.Callback {
  companion object {
    private const val TAG = "SkiaPreviewView"
  }

  private var isAlive = true
  private val thread = CameraQueues.previewQueue.handler

  init {
    holder.addCallback(this)
  }

  private fun startLooping(choreographer: Choreographer) {
    choreographer.postFrameCallback {
      if (!isAlive) return@postFrameCallback

      // Refresh UI (60 FPS)
      skiaRenderer.onPreviewFrame()
      startLooping(choreographer)
    }
  }

  override fun surfaceCreated(holder: SurfaceHolder) {
    isAlive = true
    Log.i(TAG, "onSurfaceCreated(..)")

    thread.post {
      // Create C++ part (OpenGL/Skia context)
      skiaRenderer.setPreviewSurface(holder.surface)
      // Notify Camera that we now have a Surface - Camera will start writing Frames
      onSurfaceChanged(holder.surface)

      // Start updating the Preview View (~60 FPS)
      startLooping(Choreographer.getInstance())
    }
  }

  override fun surfaceChanged(holder: SurfaceHolder, format: Int, w: Int, h: Int) {
    Log.i(TAG, "surfaceChanged($w, $h)")

    thread.post {
      // Update C++ OpenGL Surface size
      skiaRenderer.setPreviewSurfaceSize(w, h)
    }
  }

  override fun surfaceDestroyed(holder: SurfaceHolder) {
    isAlive = false
    Log.i(TAG, "surfaceDestroyed(..)")

    thread.post {
      // Notify Camera that we no longer have a Surface - Camera will stop writing Frames
      onSurfaceChanged(null)
      // Clean up C++ part (OpenGL/Skia context)
      skiaRenderer.destroyPreviewSurface()
    }
  }
}
