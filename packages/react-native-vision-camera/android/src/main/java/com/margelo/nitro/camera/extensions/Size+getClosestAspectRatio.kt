package com.margelo.nitro.camera.extensions

import androidx.camera.core.AspectRatio
import com.margelo.nitro.camera.Size
import kotlin.math.max
import kotlin.math.min

@AspectRatio.Ratio
fun Size.getClosestAspectRatio(): Int {
  if (width <= 0 || height <= 0) return AspectRatio.RATIO_DEFAULT

  val long = max(width, height)
  val short = min(width, height)

  val distanceTo43 = (long / short) - (4.0 / 3.0)
  val distanceTo169 = (long / short) - (16.0 / 9.0)
  return when {
    distanceTo43 < distanceTo169 -> AspectRatio.RATIO_4_3
    distanceTo169 < distanceTo43 -> AspectRatio.RATIO_16_9
    else -> AspectRatio.RATIO_DEFAULT
  }
}
