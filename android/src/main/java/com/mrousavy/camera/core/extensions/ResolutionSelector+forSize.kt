package com.mrousavy.camera.core.extensions

import android.util.Size
import androidx.camera.core.resolutionselector.ResolutionSelector
import kotlin.math.abs

private fun sizeDifference(left: Size, right: Size): Int = abs(left.width * left.height - right.width * right.height)
private fun aspectRatioDifference(left: Size, right: Size): Float = abs(left.aspectRatio - right.aspectRatio)

/**
 * Gets a [ResolutionSelector] that finds a resolution closest to the given target size.
 * There will always be a size available, but it is not guaranteed that it will be exactly the target size.
 * It is also possible that the resolved size is larger than the target size.
 * The given target size's aspect ratio will have priority over sizes with a similar number of total pixels.
 */
fun ResolutionSelector.Builder.forSize(size: Size): ResolutionSelector.Builder {
  return this.setResolutionFilter { supportedSizes, _ ->
    return@setResolutionFilter supportedSizes.sortedWith(compareBy({ aspectRatioDifference(it, size) }, { sizeDifference(it, size) }))
  }
}
