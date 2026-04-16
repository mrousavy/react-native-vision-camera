package com.margelo.nitro.camera.location

import android.Manifest
import android.annotation.SuppressLint
import android.os.Handler
import android.os.HandlerThread
import android.os.Looper
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.google.android.gms.location.LocationListener
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationServices
import com.margelo.nitro.NitroModules
import com.margelo.nitro.camera.HybridLocationSpec
import com.margelo.nitro.camera.extensions.getPermissionStatus
import com.margelo.nitro.camera.extensions.requestPermission
import com.margelo.nitro.camera.location.extensions.await
import com.margelo.nitro.camera.location.extensions.toPriority
import com.margelo.nitro.core.Promise
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.android.asCoroutineDispatcher

class HybridLocationManager(
  private val options: LocationManagerOptions,
) : HybridLocationManagerSpec() {
  private val context: ReactApplicationContext
    get() = NitroModules.applicationContext ?: throw Error("No Context available!")
  private val manager = LocationServices.getFusedLocationProviderClient(context)
  private val looper: Looper
  private val scope: CoroutineScope
  override var lastKnownLocation: HybridLocationSpec? = null
    private set
  private val listeners = arrayListOf<(HybridLocationSpec) -> Unit>()
  override val locationPermissionStatus: PermissionStatus
    get() {
      val fineStatus = mapPermissionStatus(Manifest.permission.ACCESS_FINE_LOCATION)
      if (fineStatus == PermissionStatus.AUTHORIZED) {
        return PermissionStatus.AUTHORIZED
      }
      val coarseStatus = mapPermissionStatus(Manifest.permission.ACCESS_COARSE_LOCATION)
      if (coarseStatus == PermissionStatus.AUTHORIZED) {
        return PermissionStatus.AUTHORIZED
      }

      if (fineStatus == PermissionStatus.NOT_DETERMINED || coarseStatus == PermissionStatus.NOT_DETERMINED) {
        return PermissionStatus.NOT_DETERMINED
      }
      if (fineStatus == PermissionStatus.RESTRICTED || coarseStatus == PermissionStatus.RESTRICTED) {
        return PermissionStatus.RESTRICTED
      }
      return PermissionStatus.DENIED
    }
  private val locationListener =
    LocationListener { location ->
      val hybridLocation = HybridLocation(location)
      this@HybridLocationManager.lastKnownLocation = hybridLocation
      for (listener in listeners) {
        listener(hybridLocation)
      }
    }

  init {
    val thread = HandlerThread("Location").apply { start() }
    val handler = Handler(thread.looper)
    val dispatcher = handler.asCoroutineDispatcher()
    looper = handler.looper
    scope = CoroutineScope(SupervisorJob() + dispatcher)
  }

  override fun requestLocationPermission(): Promise<Boolean> {
    return Promise.async(scope) {
      if (locationPermissionStatus == PermissionStatus.AUTHORIZED) {
        return@async true
      }

      if (mapPermissionStatus(Manifest.permission.ACCESS_FINE_LOCATION) == PermissionStatus.NOT_DETERMINED) {
        try {
          val hasFineLocation = context.requestPermission(Manifest.permission.ACCESS_FINE_LOCATION)
          if (hasFineLocation) {
            return@async true
          }
        } catch (e: Throwable) {
          Log.e(TAG, "Failed to request ACCESS_FINE_LOCATION permission!", e)
        }
      }

      if (mapPermissionStatus(Manifest.permission.ACCESS_COARSE_LOCATION) == PermissionStatus.NOT_DETERMINED) {
        try {
          val hasCoarseLocationPermission = context.requestPermission(Manifest.permission.ACCESS_COARSE_LOCATION)
          if (hasCoarseLocationPermission) {
            return@async true
          }
        } catch (e: Throwable) {
          Log.e(TAG, "Failed to request ACCESS_COARSE_LOCATION permission!", e)
        }
      }

      return@async locationPermissionStatus == PermissionStatus.AUTHORIZED
    }
  }

  @SuppressLint("MissingPermission")
  override fun startUpdating(): Promise<Unit> {
    return Promise.async(scope) {
      val priority = options.accuracy.toPriority()
      // Add a listener to fire when location changes
      val request =
        LocationRequest
          .Builder(priority, options.updateInterval.toLong())
          .setMinUpdateDistanceMeters(options.distanceFilter.toFloat())
          .build()
      manager
        .requestLocationUpdates(request, locationListener, looper)
        .await()
    }
  }

  override fun stopUpdating(): Promise<Unit> {
    return Promise.async {
      manager
        .removeLocationUpdates(locationListener)
        .await()
    }
  }

  override fun addOnLocationChangedListener(callback: (location: HybridLocationSpec) -> Unit): ListenerSubscription {
    listeners.add(callback)
    return ListenerSubscription {
      listeners.remove(callback)
    }
  }

  /**
   * Maps VisionCamera core `PermissionStatus` to VisionCamera location [PermissionStatus]
   * by casting the numbers.
   */
  private fun mapPermissionStatus(permission: String): PermissionStatus {
    val status = context.getPermissionStatus(permission)
    return PermissionStatus.entries[status.value]
  }
}
