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

// Calibrated so a 4:3↔16:9 mismatch costs ~1.0 (≈ one Quality bucket on the log
// scale). Values above ~10 let aspect dominate pixel proximity enough that a 12MP
// 4:3 request gets answered with SD instead of UHD.
private const val ASPECT_MISMATCH_WEIGHT = 3.0

/**
 * Computes a comparable penalty score between [this] size and [target].
 *
 * Combines two terms: a log-ratio pixel-count distance (scale-invariant - treats
 * 2x bigger and 2x smaller as equidistant) and a weighted aspect-ratio mismatch.
 * Aspect within [ASPECT_RATIO_TOLERANCE] is free; outside, it's scaled by
 * [ASPECT_MISMATCH_WEIGHT] so aspect biases the ranking without overriding large
 * pixel-count gaps.
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

/** Sorts this list of sizes by [penalty] to [targetSize] (ascending). */
fun List<Size>.sortedByClosestTo(targetSize: Size): List<Size> {
  return this.sortedBy { it.penalty(targetSize) }
}
