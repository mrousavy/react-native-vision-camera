package com.margelo.nitro.camera.extensions

import androidx.camera.core.ImageAnalysis

fun ImageAnalysis.Builder.setAllowDroppingLateFrames(allowDroppingLateFrames: Boolean): ImageAnalysis.Builder {
  if (allowDroppingLateFrames) {
    // TODO: This does not the same as `alwaysDiscardsLateVideoFrames` on iOS - this actually overwrites the latest buffer...
    return this.setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
  } else {
    return this.setBackpressureStrategy(ImageAnalysis.STRATEGY_BLOCK_PRODUCER)
  }
}
