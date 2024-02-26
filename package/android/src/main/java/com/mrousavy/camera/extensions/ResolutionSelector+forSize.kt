package com.mrousavy.camera.extensions

import android.util.Size
import androidx.camera.core.resolutionselector.ResolutionSelector

fun ResolutionSelector.Builder.forSize(size: Size): ResolutionSelector.Builder {
  return this.setResolutionFilter { supportedSizes, _ ->
    val closest = supportedSizes.closestToOrMax(size)
    return@setResolutionFilter listOf(closest)
  }
}
