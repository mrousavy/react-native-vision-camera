package com.mrousavy.camera.preview

import android.content.Context
import android.view.SurfaceView
import kotlin.math.roundToInt

/**
 * A [SurfaceView] that can be adjusted to a specified aspect ratio and
 * performs center-crop transformation of input frames.
 */
class AutoFitSurfaceView(context: Context): SurfaceView(context) {

  private var aspectRatio = 0f

  /**
   * Sets the aspect ratio for this view. The size of the view will be
   * measured based on the ratio calculated from the parameters.
   *
   * @param width  Camera resolution horizontal size
   * @param height Camera resolution vertical size
   */
  fun setAspectRatio(width: Int, height: Int) {
    require(width > 0 && height > 0) { "Size cannot be negative" }
    aspectRatio = width.toFloat() / height.toFloat()
    holder.setFixedSize(width, height)
    requestLayout()
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)
    val width = MeasureSpec.getSize(widthMeasureSpec)
    val height = MeasureSpec.getSize(heightMeasureSpec)
    if (aspectRatio == 0f) {
      setMeasuredDimension(width, height)
    } else {

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
      setMeasuredDimension(newWidth, newHeight)
    }
  }
}
