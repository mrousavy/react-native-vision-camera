package com.margelo.nitro.camera.location

import android.location.Location
import android.os.Build
import com.margelo.nitro.camera.HybridLocationSpec
import com.margelo.nitro.camera.public.NativeLocation

class HybridLocation(
  override val location: Location,
) : HybridLocationSpec(),
  NativeLocation {
  override val latitude: Double
    get() = location.latitude
  override val longitude: Double
    get() = location.longitude
  override val altitude: Double
    get() = location.altitude
  override val horizontalAccuracy: Double
    get() = location.accuracy.toDouble()
  override val verticalAccuracy: Double
    get() =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        location.verticalAccuracyMeters.toDouble()
      } else {
        -1.0
      }
  override val timestamp: Double
    get() = location.time.toDouble()
  override val isMock: Boolean
    get() =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        location.isMock
      } else {
        false
      }
}
