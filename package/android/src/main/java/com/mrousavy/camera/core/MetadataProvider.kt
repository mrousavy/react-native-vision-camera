package com.mrousavy.camera.core

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.util.Log
import androidx.core.content.ContextCompat

class MetadataProvider(val context: Context) : LocationListener {
  private val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
  companion object {
    private const val TAG = "MetadataProvider"
    private const val UPDATE_INTERVAL_MS = 0L
    private const val UPDATE_DISTANCE_M = 5f
  }

  private val hasLocationPermission: Boolean
    get() {
      val status = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
      return status == PackageManager.PERMISSION_GRANTED
    }
  var location: Location? = null
    private set

  @SuppressLint("MissingPermission")
  fun enableLocationUpdates(enable: Boolean) {
    if (enable) {
      if (!hasLocationPermission) {
        throw LocationPermissionError()
      }

      Log.i(TAG, "Start updating location...")
      locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, UPDATE_INTERVAL_MS, UPDATE_DISTANCE_M, this)
      this.location = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
    } else {
      Log.i(TAG, "Stopping location updates...")
      locationManager.removeUpdates(this)
    }
  }

  override fun onLocationChanged(location: Location) {
    Log.i(TAG, "Location updated: ${location.latitude}, ${location.longitude}")
    this.location = location
  }
}
