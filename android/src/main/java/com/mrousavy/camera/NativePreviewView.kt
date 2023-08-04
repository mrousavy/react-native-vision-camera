package com.mrousavy.camera

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.Resources
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.util.Log
import android.util.Size
import android.view.Surface
import android.view.SurfaceHolder
import android.view.SurfaceView
import com.mrousavy.camera.extensions.bigger
import com.mrousavy.camera.extensions.smaller
import kotlin.math.roundToInt

/**
 * A [SurfaceView] that can be adjusted to a specified aspect ratio and
 * performs center-crop transformation of input frames.
 */
@SuppressLint("ViewConstructor")
class NativePreviewView(cameraManager: CameraManager,
                        cameraId: String,
                        context: Context,
                        private val onSurfaceChanged: (surface: Surface?) -> Unit): SurfaceView(context) {
  private val targetSize: Size
  private val aspectRatio: Float
    get() = targetSize.width.toFloat() / targetSize.height.toFloat()

  private fun getMaximumPreviewSize(): Size {
    // See https://developer.android.com/reference/android/hardware/camera2/params/StreamConfigurationMap
    // According to the Android Developer documentation, PREVIEW streams can have a resolution
    // of up to the phone's display's resolution, with a maximum of 1920x1080.
    val display1080p = Size(1920, 1080)
    val displaySize = Size(Resources.getSystem().displayMetrics.widthPixels, Resources.getSystem().displayMetrics.heightPixels)
    val isHighResScreen = displaySize.bigger >= display1080p.bigger || displaySize.smaller >= display1080p.smaller
    Log.i(TAG, "Phone has a ${displaySize.width} x ${displaySize.height} screen.")
    return if (isHighResScreen) display1080p else displaySize
  }

  init {
    val characteristics = cameraManager.getCameraCharacteristics(cameraId)
    val config = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)!!
    val previewSize = getMaximumPreviewSize()
    val outputSizes = config.getOutputSizes(34 /* TODO: ImageFormat.PRIVATE */).sortedByDescending { it.width * it.height }
    targetSize = outputSizes.first { it.bigger <= previewSize.bigger && it.smaller <= previewSize.smaller }

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
    private const val TAG = "NativePreviewView"
  }
}
