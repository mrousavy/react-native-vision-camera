package com.mrousavy.camera.core

import android.annotation.SuppressLint
import android.content.Context
import android.hardware.camera2.CameraManager
import android.util.Log
import android.util.Size
import android.view.Surface
import android.view.SurfaceHolder
import android.view.SurfaceView
import com.mrousavy.camera.extensions.bigger
import com.mrousavy.camera.extensions.getPreviewSize
import com.mrousavy.camera.extensions.smaller
import kotlin.math.roundToInt

@SuppressLint("ViewConstructor")
class PreviewView(context: Context,
                  val targetSize: Size,
                  private val onSurfaceChanged: (surface: Surface?) -> Unit): SurfaceView(context) {
  private val aspectRatio: Double
    get() = targetSize.bigger.toDouble() / targetSize.smaller

  init {
    Log.i(TAG, "Using Preview Size ${targetSize.width} x ${targetSize.height}.")
    holder.setFixedSize(targetSize.width, targetSize.height)
    holder.addCallback(object: SurfaceHolder.Callback {
      override fun surfaceCreated(holder: SurfaceHolder) {
        Log.i(TAG, "Surface created! ${holder.surface}")
        onSurfaceChanged(holder.surface)
      }

      override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
        Log.i(TAG, "Surface resized! ${holder.surface} ($width x $height in format #$format)")
      }

      override fun surfaceDestroyed(holder: SurfaceHolder) {
        Log.i(TAG, "Surface destroyed! ${holder.surface}")
        onSurfaceChanged(null)
      }
    })
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)
    val viewWidth = MeasureSpec.getSize(widthMeasureSpec)
    val viewHeight = MeasureSpec.getSize(heightMeasureSpec)
    val viewAspectRatio = viewWidth.toDouble() / viewHeight

    if (viewAspectRatio.isNaN()) {
      return
    }
    Log.d(TAG, "onMeasure($viewWidth, $viewHeight) $viewAspectRatio")

    var newWidth: Int = viewWidth
    var newHeight: Int = viewHeight

    if (viewAspectRatio > aspectRatio) {
      newWidth = (viewHeight / aspectRatio).roundToInt()
    } else {
      newHeight = (viewWidth * aspectRatio).roundToInt()
    }

    Log.d(TAG, "Fitted dimensions set: $newWidth x $newHeight")
    setMeasuredDimension(newWidth, newHeight)
  }

  companion object {
    private const val TAG = "PreviewView"
  }
}
