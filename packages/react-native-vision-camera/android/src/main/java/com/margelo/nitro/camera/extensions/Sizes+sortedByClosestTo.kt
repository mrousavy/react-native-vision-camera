package com.margelo.nitro.camera.extensions

import android.util.Size
import kotlin.math.abs
import kotlin.math.ln

/** The longer edge of this size (orientation-independent). */
val Size.long: Int get() = maxOf(width, height)

/** The shorter edge of this size (orientation-independent). */
val Size.short: Int get() = minOf(width, height)

/** Maximum relative difference in aspect ratio to still be considered a "match". */
private const val ASPECT_RATIO_TOLERANCE = 0.02

/** Weight multiplied by the aspect ratio difference when outside [ASPECT_RATIO_TOLERANCE]. */
private const val ASPECT_MISMATCH_WEIGHT = 100.0

/**
 * Computes a comparable penalty score between [this] size and [target].
 *
 * Primary: sizes matching the target aspect ratio (within [ASPECT_RATIO_TOLERANCE])
 * are always preferred. Secondary: among the same aspect-ratio group, sizes are
 * ranked by log-ratio of pixel counts (scale-invariant — treats 2x bigger and
 * 2x smaller as equidistant).
 */
fun Size.penalty(target: Size): Double {
  val targetAspectRatio = target.long.toDouble() / target.short.toDouble()
  val actualAspectRatio = this.long.toDouble() / this.short.toDouble()
  val aspectRatioDiff = abs(actualAspectRatio - targetAspectRatio) / targetAspectRatio
  val aspectRatioPenalty = if (aspectRatioDiff < ASPECT_RATIO_TOLERANCE) 0.0 else ASPECT_MISMATCH_WEIGHT * aspectRatioDiff

  val targetPixels = target.width.toDouble() * target.height.toDouble()
  val actualPixels = width.toDouble() * height.toDouble()
  val logPixelDistance = abs(ln(actualPixels / targetPixels))

  return aspectRatioPenalty + logPixelDistance
}

/**
 * Sorts this list of sizes by closeness to [targetSize], preferring
 * matching aspect ratios first, then closest pixel count (log-scale).
 */
fun List<Size>.sortedByClosestTo(targetSize: Size): List<Size> {
  return this.sortedBy { it.penalty(targetSize) }
}
