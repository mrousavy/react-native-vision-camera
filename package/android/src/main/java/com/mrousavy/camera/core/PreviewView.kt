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
  private var resizeMode: ResizeMode = ResizeMode.COVER
  private var inputOrientation: Orientation = Orientation.LANDSCAPE_LEFT
  private var surfaceSize: Size = CameraDeviceDetails.getMaximumPreviewSize()
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
    holder.setFixedSize(surfaceSize.width, surfaceSize.height)
  }

  override fun surfaceCreated(holder: SurfaceHolder) = Unit
  override fun surfaceDestroyed(holder: SurfaceHolder) = Unit
  override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
    surfaceSize = Size(width, height)
    updateLayout()
  }

  fun setResizeMode(resizeMode: ResizeMode) {
    this.resizeMode = resizeMode
    updateLayout()
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
    requestLayout()
    if (UiThreadUtil.isOnUiThread()) {
      invalidate()
    } else {
      postInvalidate()
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

  @SuppressLint("DrawAllocation")
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)

    val viewWidth = MeasureSpec.getSize(widthMeasureSpec)
    val viewHeight = MeasureSpec.getSize(heightMeasureSpec)

    if (surfaceSize.width == 0 || surfaceSize.height == 0) {
      // Camera size is not set yet. Just match the given specs.
      setMeasuredDimension(viewWidth, viewHeight)
      return
    }

    val size = surfaceSize.rotatedBy(inputOrientation)

    val aspectRatio = size.width.toDouble() / size.height
    val viewAspectRatio = viewWidth.toDouble() / viewHeight

    when (resizeMode) {
      ResizeMode.CONTAIN -> {
        if (viewAspectRatio > aspectRatio) {
          // Adjust width
          setMeasuredDimension((viewHeight * aspectRatio).toInt(), viewHeight)
        } else {
          // Adjust height
          setMeasuredDimension(viewWidth, (viewWidth / aspectRatio).toInt())
        }
      }
      ResizeMode.COVER -> {
        if (viewAspectRatio < aspectRatio) {
          // Adjust width
          setMeasuredDimension((viewHeight * aspectRatio).toInt(), viewHeight)
        } else {
          // Adjust height
          setMeasuredDimension(viewWidth, (viewWidth / aspectRatio).toInt())
        }
      }
    }
  }

  companion object {
    private const val TAG = "PreviewView"
  }
}
