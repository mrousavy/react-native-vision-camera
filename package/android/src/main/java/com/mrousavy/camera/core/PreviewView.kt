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
import com.mrousavy.camera.extensions.installHierarchyFitter
import com.mrousavy.camera.extensions.resize
import com.mrousavy.camera.extensions.rotatedBy
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.ResizeMode
import kotlin.math.roundToInt
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@SuppressLint("ViewConstructor")
class PreviewView(context: Context, callback: SurfaceHolder.Callback) :
  FrameLayout(context),
  SurfaceHolder.Callback {
  var size: Size = CameraDeviceDetails.getMaximumPreviewSize()
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
  private var inputOrientation: Orientation = Orientation.LANDSCAPE_LEFT
    set(value) {
      field = value
      UiThreadUtil.runOnUiThread {
        Log.i(TAG, "Camera Input Orientation changed to $value!")
        requestLayout()
        invalidate()
      }
    }
  private val viewSize: Size
    get() {
      val displayMetrics = context.resources.displayMetrics
      val dpX = width / displayMetrics.density
      val dpY = height / displayMetrics.density
      return Size(dpX.toInt(), dpY.toInt())
    }
  private val surfaceView = SurfaceView(context)

  init {
    Log.i(TAG, "Creating PreviewView...")
    this.installHierarchyFitter()
    surfaceView.layoutParams = LayoutParams(
      LayoutParams.MATCH_PARENT,
      LayoutParams.MATCH_PARENT,
      Gravity.CENTER
    )
    surfaceView.holder.setKeepScreenOn(true)
    surfaceView.holder.addCallback(this)
    surfaceView.holder.addCallback(callback)
    addView(surfaceView)
  }

  override fun surfaceCreated(holder: SurfaceHolder) = Unit
  override fun surfaceDestroyed(holder: SurfaceHolder) = Unit
  override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
    Log.i(TAG, "PreviewView Surface size changed: $size -> ${width}x$height, re-computing layout...")
    size = Size(width, height)
    requestLayout()
    invalidate()
  }

  suspend fun setSurfaceSize(width: Int, height: Int, cameraSensorOrientation: Orientation) {
    withContext(Dispatchers.Main) {
      inputOrientation = cameraSensorOrientation
      surfaceView.holder.resize(width, height)
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

  private fun getSize(contentSize: Size, containerSize: Size, resizeMode: ResizeMode): Size {
    // TODO: Take sensor orientation into account here
    val contentAspectRatio = contentSize.width.toDouble() / contentSize.height
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
    val surfaceSize = size.rotatedBy(inputOrientation)
    val fittedSize = getSize(surfaceSize, viewSize, resizeMode)

    Log.i(TAG, "PreviewView is $viewSize, rendering $surfaceSize content ($inputOrientation). Resizing to: $fittedSize ($resizeMode)")
    setMeasuredDimension(fittedSize.width, fittedSize.height)
  }

  companion object {
    private const val TAG = "PreviewView"
  }
}
