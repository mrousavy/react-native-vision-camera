package com.mrousavy.camera.extensions

import android.util.Log
import android.view.SurfaceHolder
import androidx.annotation.UiThread
import kotlin.coroutines.resume
import kotlinx.coroutines.suspendCancellableCoroutine

private const val TAG = "SurfaceHolder"

@UiThread
suspend fun SurfaceHolder.resize(targetWidth: Int, targetHeight: Int) {
  return suspendCancellableCoroutine { continuation ->
    val currentSize = this.surfaceFrame
    if (currentSize.width() == targetWidth && currentSize.height() == targetHeight) {
      // Already in target size
      continuation.resume(Unit)
      return@suspendCancellableCoroutine
    }

    Log.i(TAG, "Resizing SurfaceHolder to $targetWidth x $targetHeight...")

    val callback = object : SurfaceHolder.Callback {
      override fun surfaceCreated(holder: SurfaceHolder) = Unit
      override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
        if (width == targetWidth && height == targetHeight) {
          holder.removeCallback(this)
          Log.i(TAG, "Resized SurfaceHolder to $width x $height!")
          continuation.resume(Unit)
        }
      }
      override fun surfaceDestroyed(holder: SurfaceHolder) {
        holder.removeCallback(this)
        Log.e(TAG, "Failed to resize SurfaceHolder to $targetWidth x $targetHeight!")
        continuation.cancel(Error("Tried to resize SurfaceView, but Surface has been destroyed!"))
      }
    }
    this.addCallback(callback)
    this.setFixedSize(targetWidth, targetHeight)
  }
}
