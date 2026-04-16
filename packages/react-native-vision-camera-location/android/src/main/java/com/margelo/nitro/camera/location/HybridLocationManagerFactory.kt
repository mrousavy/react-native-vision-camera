package com.margelo.nitro.camera.location

import android.location.Location
import androidx.annotation.Keep
import com.facebook.jni.annotations.DoNotStrip
import com.margelo.nitro.camera.HybridLocationSpec

@DoNotStrip
@Keep
class HybridLocationManagerFactory : HybridLocationManagerFactorySpec() {
  @DoNotStrip
  @Keep
  override fun createLocationManager(options: LocationManagerOptions): HybridLocationManagerSpec {
    return HybridLocationManager(options)
  }

  override fun createLocation(
    latitude: Double,
    longitude: Double,
  ): HybridLocationSpec {
    val location =
      Location("custom_created").apply {
        this.latitude = latitude
        this.longitude = longitude
      }
    return HybridLocation(location)
  }
}
