package com.margelo.nitro.camera.extensions

import com.margelo.nitro.camera.Range

fun Range.contains(value: Double): Boolean {
  return value in min..max
}
