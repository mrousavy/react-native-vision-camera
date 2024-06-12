package com.mrousavy.camera.core.extensions

import androidx.camera.core.resolutionselector.ResolutionSelector
import kotlin.math.abs

/**
 * Gets a [ResolutionSelector] that finds a resolution closest to the given target aspect ratio.
 */
fun ResolutionSelector.Builder.forAspectRatio(aspectRatio: Float): ResolutionSelector.Builder {
  return this.setResolutionFilter { supportedSizes, _ ->
    return@setResolutionFilter supportedSizes.sortedWith(
      compareBy(
        // Compare difference in aspect ratios first,
        { abs(it.width.toFloat() / it.height - aspectRatio) },
        // ..and total resolution afterwards.
        { -(it.width * it.height) }
      )
    )
  }
}
