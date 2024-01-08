package com.mrousavy.camera.core

import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
import android.util.Size
import android.view.Gravity
import android.view.SurfaceHolder
import android.view.SurfaceView
import android.widget.FrameLayout
import com.facebook.react.bridge.UiThreadUtil
import com.mrousavy.camera.extensions.getMaximumPreviewSize
import com.mrousavy.camera.types.ResizeMode
import kotlin.math.roundToInt

@SuppressLint("ViewConstructor")
class PreviewView(context: Context, callback: SurfaceHolder.Callback) : SurfaceView(context) {
  var size: Size = getMaximumPreviewSize()
    set(value) {
      field = value
      UiThreadUtil.runOnUiThread {
        Log.i(TAG, "Resizing PreviewView to ${value.width} x ${value.height}...")
        holder.setFixedSize(value.width, value.height)
        requestLayout()
        invalidate()
      }
    }
  var resizeMode: ResizeMode = ResizeMode.COVER
    set(value) {
      field = value
      UiThreadUtil.runOnUiThread {
        requestLayout()
        invalidate()
      }
    }

  init {
    Log.i(TAG, "Creating PreviewView...")
    layoutParams = FrameLayout.LayoutParams(
      FrameLayout.LayoutParams.MATCH_PARENT,
      FrameLayout.LayoutParams.MATCH_PARENT,
      Gravity.CENTER
    )
    holder.addCallback(callback)
  }

  /*fun resizeToInputCamera(cameraId: String, cameraManager: CameraManager, format: CameraDeviceFormat?) {
    val characteristics = cameraManager.getCameraCharacteristics(cameraId)

    val targetPreviewSize = format?.videoSize
    val formatAspectRatio = if (targetPreviewSize != null) targetPreviewSize.bigger.toDouble() / targetPreviewSize.smaller else null
    size = characteristics.getPreviewTargetSize(formatAspectRatio)
  }*/

  private fun getSize(contentSize: Size, containerSize: Size, resizeMode: ResizeMode): Size {
    val contentAspectRatio = contentSize.height.toDouble() / contentSize.width
    val containerAspectRatio = containerSize.width.toDouble() / containerSize.height

    Log.i(TAG, "Content Size: $contentSize ($contentAspectRatio) | Container Size: $containerSize ($containerAspectRatio)")

    val widthOverHeight = when (resizeMode) {
      ResizeMode.COVER -> contentAspectRatio > containerAspectRatio
      ResizeMode.CONTAIN -> contentAspectRatio < containerAspectRatio
    }

    return if (widthOverHeight) {
      // Scale by width to cover height
      val scaledWidth = containerSize.height * contentAspectRatio
      Size(scaledWidth.roundToInt(), containerSize.height)
    } else {
      // Scale by height to cover width
      val scaledHeight = containerSize.width / contentAspectRatio
      Size(containerSize.width, scaledHeight.roundToInt())
    }
  }

  @SuppressLint("DrawAllocation")
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)

    val viewSize = Size(MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.getSize(heightMeasureSpec))
    val fittedSize = getSize(size, viewSize, resizeMode)

    Log.i(TAG, "PreviewView is $viewSize, rendering $size content. Resizing to: $fittedSize ($resizeMode)")
    setMeasuredDimension(fittedSize.width, fittedSize.height)
  }

  companion object {
    private const val TAG = "PreviewView"
  }
}
