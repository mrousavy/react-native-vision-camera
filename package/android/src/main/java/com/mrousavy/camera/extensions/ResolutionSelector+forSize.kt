package com.mrousavy.camera.extensions

import android.util.Size
import androidx.camera.core.resolutionselector.ResolutionSelector
import kotlin.math.abs

private fun difference(left: Size, right: Size): Int = abs(left.width * left.height - right.width * right.height)

fun ResolutionSelector.Builder.forSize(size: Size): ResolutionSelector.Builder {
  return this.setResolutionFilter { supportedSizes, _ ->
    // sort list by "closest to target size", that way we always have a fall-back size
    // if the target size cannot be met by the Camera pipeline.
    return@setResolutionFilter supportedSizes.sortedBy { difference(it, size) }
  }
}
