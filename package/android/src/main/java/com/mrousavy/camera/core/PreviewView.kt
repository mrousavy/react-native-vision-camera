package com.mrousavy.camera.core

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Point
import android.util.Log
import android.util.Size
import android.view.Gravity
import android.view.SurfaceHolder
import android.view.SurfaceView
import android.widget.FrameLayout
import com.facebook.react.bridge.UiThreadUtil
import com.mrousavy.camera.extensions.getMaximumPreviewSize
import com.mrousavy.camera.extensions.resize
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.ResizeMode
import kotlin.math.roundToInt
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@SuppressLint("ViewConstructor")
class PreviewView(context: Context, callback: SurfaceHolder.Callback) : SurfaceView(context) {
  var size: Size = getMaximumPreviewSize()
    private set
  var resizeMode: ResizeMode = ResizeMode.COVER
    set(value) {
      field = value
      UiThreadUtil.runOnUiThread {
        Log.i(TAG, "Setting PreviewView ResizeMode to $value...")
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
    holder.setKeepScreenOn(true)
    holder.addCallback(callback)
  }

  suspend fun setSurfaceSize(width: Int, height: Int) {
    withContext(Dispatchers.Main) {
      size = Size(width, height)
      Log.i(TAG, "Setting PreviewView Surface Size to $size...")
      requestLayout()
      invalidate()
      holder.resize(width, height)
    }
  }

  private val viewSize: Size
    get() {
      val displayMetrics = context.resources.displayMetrics
      val dpX = width / displayMetrics.density
      val dpY = height / displayMetrics.density
      return Size(dpX.toInt(), dpY.toInt())
    }

  fun convertLayerPointToCameraCoordinates(point: Point, cameraDeviceDetails: CameraDeviceDetails): Point {
    val sensorOrientation = Orientation.fromRotationDegrees(cameraDeviceDetails.sensorOrientation)
    val cameraSize = Size(cameraDeviceDetails.activeSize.width(), cameraDeviceDetails.activeSize.height())
    val viewOrientation = Orientation.PORTRAIT

    val rotated = Orientation.rotatePoint(point, viewSize, cameraSize, viewOrientation, sensorOrientation)
    Log.i(TAG, "$point -> $sensorOrientation (in $cameraSize -> $viewSize) -> $rotated")
    return rotated
  }

  private fun getSize(contentSize: Size, containerSize: Size, resizeMode: ResizeMode): Size {
    // TODO: Take sensor orientation into account here
    val contentAspectRatio = contentSize.height.toDouble() / contentSize.width
    val containerAspectRatio = containerSize.width.toDouble() / containerSize.height

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
