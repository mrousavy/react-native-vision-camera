package com.mrousavy.camera.extensions

import android.hardware.camera2.params.DynamicRangeProfiles
import android.os.Build
import androidx.annotation.RequiresApi

private fun Set<Long>.firstMatch(filter: Set<Long>): Long? {
  filter.forEach { f ->
    if (this.contains(f)) {
      return f
    }
  }
  return null
}

@RequiresApi(Build.VERSION_CODES.TIRAMISU)
private val bestProfiles = setOf(
  DynamicRangeProfiles.HDR10_PLUS,
  DynamicRangeProfiles.HDR10,
  DynamicRangeProfiles.HLG10
)

val DynamicRangeProfiles.bestProfile: Long?
  get() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return null
    return supportedProfiles.firstMatch(bestProfiles)
  }
