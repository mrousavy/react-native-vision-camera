package com.mrousavy.camera.core

import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
import android.util.Size
import android.view.Surface
import android.view.SurfaceHolder
import android.view.SurfaceView
import com.mrousavy.camera.parsers.ResizeMode
import kotlin.math.roundToInt

@SuppressLint("ViewConstructor")
class PreviewView(
  context: Context,
  val targetSize: Size,
  private val resizeMode: ResizeMode,
  private val onSurfaceChanged: (surface: Surface?) -> Unit
) : SurfaceView(context) {

  init {
    Log.i(TAG, "Using Preview Size ${targetSize.width} x ${targetSize.height}.")
    holder.setFixedSize(targetSize.width, targetSize.height)
    holder.addCallback(object : SurfaceHolder.Callback {
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

  private fun coverSize(contentSize: Size, containerWidth: Int, containerHeight: Int): Size {
    val contentAspectRatio = contentSize.height.toDouble() / contentSize.width
    val containerAspectRatio = containerWidth.toDouble() / containerHeight

    Log.d(TAG, "coverSize :: $contentSize ($contentAspectRatio), ${containerWidth}x$containerHeight ($containerAspectRatio)")

    return if (contentAspectRatio > containerAspectRatio) {
      // Scale by width to cover height
      val scaledWidth = containerHeight * contentAspectRatio
      Size(scaledWidth.roundToInt(), containerHeight)
    } else {
      // Scale by height to cover width
      val scaledHeight = containerWidth / contentAspectRatio
      Size(containerWidth, scaledHeight.roundToInt())
    }
  }

  private fun containSize(contentSize: Size, containerWidth: Int, containerHeight: Int): Size {
    val contentAspectRatio = contentSize.height.toDouble() / contentSize.width
    val containerAspectRatio = containerWidth.toDouble() / containerHeight

    Log.d(TAG, "containSize :: $contentSize ($contentAspectRatio), ${containerWidth}x$containerHeight ($containerAspectRatio)")

    return if (contentAspectRatio > containerAspectRatio) {
      // Scale by height to fit within width
      val scaledHeight = containerWidth / contentAspectRatio
      return Size(containerWidth, scaledHeight.roundToInt())
    } else {
      // Scale by width to fit within height
      val scaledWidth = containerHeight * contentAspectRatio
      return Size(scaledWidth.roundToInt(), containerHeight)
    }
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)
    val viewWidth = MeasureSpec.getSize(widthMeasureSpec)
    val viewHeight = MeasureSpec.getSize(heightMeasureSpec)

    Log.d(TAG, "onMeasure($viewWidth, $viewHeight)")

    val fittedSize = when (resizeMode) {
      ResizeMode.COVER -> this.coverSize(targetSize, viewWidth, viewHeight)
      ResizeMode.CONTAIN -> this.containSize(targetSize, viewWidth, viewHeight)
    }

    Log.d(TAG, "Fitted dimensions set: $fittedSize")
    setMeasuredDimension(fittedSize.width, fittedSize.height)
  }

  companion object {
    private const val TAG = "PreviewView"
  }
}
