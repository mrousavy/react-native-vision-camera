package com.margelo.nitro.camera.extensions

import android.annotation.SuppressLint
import android.util.Log
import androidx.camera.video.Quality
import androidx.camera.video.QualitySelector
import com.margelo.nitro.camera.Size
import com.margelo.nitro.camera.extensions.converters.toSize

@SuppressLint("RestrictedApi")
fun Size.toQualitySelector(): QualitySelector {
  val targetSize = this.toSize()
  val all = Quality.getSortedQualities()
  val sorted =
    all.sortedBy { quality ->
      if (quality is Quality.ConstantQuality) {
        // Find the typical size closest to our target for this Quality tier,
        // reusing the same aspect-ratio-first + log-ratio ranking as sortedByClosestTo.
        quality.typicalSizes.minOfOrNull { it.penalty(targetSize) } ?: Double.MAX_VALUE
      } else {
        Log.w("QualitySelector", "Quality $quality is not a ConstantQuality - cannot determine its Resolution...")
        Double.MAX_VALUE
      }
    }
  return QualitySelector.fromOrderedList(sorted)
}
