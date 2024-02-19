package com.mrousavy.camera.core

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Point
import android.util.Log
import android.util.Size
import android.view.SurfaceHolder
import android.view.SurfaceView
import com.facebook.react.bridge.UiThreadUtil
import com.mrousavy.camera.extensions.resize
import com.mrousavy.camera.extensions.rotatedBy
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.ResizeMode
import kotlin.math.roundToInt
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@SuppressLint("ViewConstructor")
class PreviewView(context: Context, callback: SurfaceHolder.Callback) :
  SurfaceView(context),
  SurfaceHolder.Callback {
  var size: Size = CameraDeviceDetails.getMaximumPreviewSize()
    set(value) {
      if (field != value) {
        Log.i(TAG, "Surface Size changed: $field -> $value")
        field = value
        updateLayout()
      }
    }
  var resizeMode: ResizeMode = ResizeMode.COVER
    set(value) {
      if (field != value) {
        Log.i(TAG, "Resize Mode changed: $field -> $value")
        field = value
        updateLayout()
      }
    }
  private var inputOrientation: Orientation = Orientation.LANDSCAPE_LEFT
    set(value) {
      if (field != value) {
        Log.i(TAG, "Input Orientation changed: $field -> $value")
        field = value
        updateLayout()
      }
    }
  private val viewSize: Size
    get() {
      val displayMetrics = context.resources.displayMetrics
      val dpX = width / displayMetrics.density
      val dpY = height / displayMetrics.density
      return Size(dpX.toInt(), dpY.toInt())
    }

  init {
    Log.i(TAG, "Creating PreviewView...")
    holder.setKeepScreenOn(true)
    holder.addCallback(this)
    holder.addCallback(callback)
    holder.setFixedSize(size.width, size.height)
  }

  override fun surfaceCreated(holder: SurfaceHolder) = Unit
  override fun surfaceDestroyed(holder: SurfaceHolder) = Unit
  override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
    size = Size(width, height)
  }

  suspend fun setSurfaceSize(width: Int, height: Int, cameraSensorOrientation: Orientation) {
    withContext(Dispatchers.Main) {
      inputOrientation = cameraSensorOrientation
      holder.resize(width, height)
    }
  }

  fun convertLayerPointToCameraCoordinates(point: Point, cameraDeviceDetails: CameraDeviceDetails): Point {
    val sensorOrientation = cameraDeviceDetails.sensorOrientation
    val cameraSize = Size(cameraDeviceDetails.activeSize.width(), cameraDeviceDetails.activeSize.height())
    val viewOrientation = Orientation.PORTRAIT

    val rotated = point.rotatedBy(viewSize, cameraSize, viewOrientation, sensorOrientation)
    Log.i(TAG, "Converted layer point $point to camera point $rotated! ($sensorOrientation, $cameraSize -> $viewSize)")
    return rotated
  }

  private fun updateLayout() {
    UiThreadUtil.runOnUiThread {
      requestLayout()
      invalidate()
    }
  }

  override fun requestLayout() {
    super.requestLayout()
    // Manually trigger measure & layout, as RN on Android skips those.
    // See this issue: https://github.com/facebook/react-native/issues/17968#issuecomment-721958427
    post {
      measure(MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY), MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY))
      layout(left, top, right, bottom)
    }
  }

  private fun getSize(contentSize: Size, containerSize: Size, resizeMode: ResizeMode): Size {
    val contentAspectRatio = contentSize.width.toDouble() / contentSize.height
    val containerAspectRatio = containerSize.width.toDouble() / containerSize.height
    if (!(contentAspectRatio > 0 && containerAspectRatio > 0)) {
      // One of the aspect ratios is 0 or NaN, maybe the view hasn't been laid out yet.
      return contentSize
    }

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
    val surfaceSize = size.rotatedBy(inputOrientation)
    val fittedSize = getSize(surfaceSize, viewSize, resizeMode)

    Log.i(TAG, "PreviewView is $viewSize, rendering $surfaceSize content ($inputOrientation). Resizing to: $fittedSize ($resizeMode)")
    setMeasuredDimension(fittedSize.width, fittedSize.height)
  }

  companion object {
    private const val TAG = "PreviewView"
  }
}
