package com.margelo.nitro.camera.location.extensions

import com.google.android.gms.location.Priority
import com.margelo.nitro.camera.location.LocationAccuracy

fun LocationAccuracy.toPriority(): @Priority Int {
  return when (this) {
    LocationAccuracy.LOW -> Priority.PRIORITY_LOW_POWER
    LocationAccuracy.BALANCED -> Priority.PRIORITY_BALANCED_POWER_ACCURACY
    LocationAccuracy.HIGH -> Priority.PRIORITY_HIGH_ACCURACY
  }
}
