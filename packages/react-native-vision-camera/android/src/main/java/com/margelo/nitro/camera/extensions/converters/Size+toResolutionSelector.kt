package com.margelo.nitro.camera.extensions.converters

import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.core.resolutionselector.ResolutionStrategy
import com.margelo.nitro.camera.Size

private fun Size.toAndroidSize(): android.util.Size {
  return android.util.Size(width.toInt(), height.toInt())
}

fun Size.toResolutionSelector(): ResolutionSelector {
  val strategy =
    ResolutionStrategy(
      this.toAndroidSize(),
      ResolutionStrategy.FALLBACK_RULE_CLOSEST_HIGHER_THEN_LOWER,
    )
  return ResolutionSelector
    .Builder()
    .setResolutionStrategy(strategy)
    .setAllowedResolutionMode(ResolutionSelector.PREFER_CAPTURE_RATE_OVER_HIGHER_RESOLUTION)
    .build()
}
