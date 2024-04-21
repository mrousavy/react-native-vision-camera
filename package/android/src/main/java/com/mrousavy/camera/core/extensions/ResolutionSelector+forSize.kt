package com.mrousavy.camera.core.extensions

import android.util.Size
import androidx.camera.core.resolutionselector.ResolutionSelector
import kotlin.math.abs

private fun difference(left: Size, right: Size): Int = abs(left.width * left.height - right.width * right.height)

/**
 * Gets a [ResolutionSelector] that finds a resolution closest to the given target size.
 * There will always be a size available, but it is not guaranteed that it will be exactly the target size.
 * It is also possible that the resolved size is larger than the target size.
 */
fun ResolutionSelector.Builder.forSize(size: Size): ResolutionSelector.Builder {
  return this.setResolutionFilter { supportedSizes, _ ->
    return@setResolutionFilter supportedSizes.sortedBy { difference(it, size) }
  }
}
