package com.mrousavy.camera.core

import android.annotation.SuppressLint
import android.content.Context
import android.hardware.camera2.CameraManager
import android.util.Log
import android.util.Size
import android.view.Surface
import android.view.SurfaceHolder
import android.view.SurfaceView
import com.mrousavy.camera.extensions.getPreviewSize
import kotlin.math.roundToInt

@SuppressLint("ViewConstructor")
class PreviewView(context: Context,
                  cameraManager: CameraManager,
                  cameraId: String,
                  private val onSurfaceChanged: (surface: Surface?) -> Unit): SurfaceView(context) {
  private val targetSize: Size
  private val aspectRatio: Float
    get() = targetSize.width.toFloat() / targetSize.height.toFloat()

  init {
    val characteristics = cameraManager.getCameraCharacteristics(cameraId)
    targetSize = characteristics.getPreviewSize()

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
    val width = MeasureSpec.getSize(widthMeasureSpec)
    val height = MeasureSpec.getSize(heightMeasureSpec)
    Log.d(TAG, "onMeasure($width, $height)")

    // Performs center-crop transformation of the camera frames
    val newWidth: Int
    val newHeight: Int
    val actualRatio = if (width > height) aspectRatio else 1f / aspectRatio
    if (width < height * actualRatio) {
      newHeight = height
      newWidth = (height * actualRatio).roundToInt()
    } else {
      newWidth = width
      newHeight = (width / actualRatio).roundToInt()
    }

    Log.d(TAG, "Measured dimensions set: $newWidth x $newHeight")
    setMeasuredDimension(newWidth, newHeight)
  }

  companion object {
    private const val TAG = "PreviewView"
  }
}
