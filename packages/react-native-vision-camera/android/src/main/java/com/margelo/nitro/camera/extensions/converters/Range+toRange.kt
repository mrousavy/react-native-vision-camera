package com.margelo.nitro.camera.extensions.converters

import com.margelo.nitro.camera.Range

fun Range.Companion.from(range: android.util.Range<Int>): Range {
  return Range(range.lower.toDouble(), range.upper.toDouble())
}
