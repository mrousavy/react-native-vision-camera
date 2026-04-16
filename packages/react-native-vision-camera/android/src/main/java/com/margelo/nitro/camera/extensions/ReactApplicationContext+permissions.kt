package com.margelo.nitro.camera.extensions

import android.content.pm.PackageManager
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import com.margelo.nitro.camera.PermissionStatus
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

fun ReactApplicationContext.getPermissionStatus(permission: String): PermissionStatus {
  val status = ContextCompat.checkSelfPermission(this, permission)
  return when (status) {
    PackageManager.PERMISSION_DENIED -> {
      val hasRequestedPermissionBefore = PermissionStateStore.hasRequestedPermission(this, permission)
      if (!hasRequestedPermissionBefore) {
        return PermissionStatus.NOT_DETERMINED
      }
      if (PermissionStateStore.isPermissionPermanentlyDenied(this, permission)) {
        return PermissionStatus.DENIED
      }
      val activity = this.currentActivity
      if (activity != null) {
        val canRequestAgain = ActivityCompat.shouldShowRequestPermissionRationale(activity, permission)
        if (!canRequestAgain) {
          return PermissionStatus.DENIED
        }
      }
      return PermissionStatus.NOT_DETERMINED
    }
    PackageManager.PERMISSION_GRANTED -> {
      PermissionStateStore.setHasRequestedPermission(this, permission, false)
      PermissionStateStore.setPermissionPermanentlyDenied(this, permission, false)
      PermissionStatus.AUTHORIZED
    }
    else -> {
      Log.e("Permissions", "Unknown Permission Status! $status")
      return PermissionStatus.NOT_DETERMINED
    }
  }
}

private var permissionRequestCode: Int = 3682

suspend fun ReactApplicationContext.requestPermission(permission: String): Boolean {
  return suspendCoroutine { continuation ->
    val activity = currentActivity ?: throw Error("No Activity!")
    if (activity is PermissionAwareActivity) {
      PermissionStateStore.setHasRequestedPermission(this, permission, true)
      val currentRequestCode = permissionRequestCode++
      val listener =
        PermissionListener { requestCode: Int, _: Array<String>, grantResults: IntArray ->
          if (requestCode == currentRequestCode) {
            val permissionStatus = grantResults.firstOrNull() ?: PackageManager.PERMISSION_DENIED
            val hasPermission = permissionStatus == PackageManager.PERMISSION_GRANTED
            if (hasPermission) {
              PermissionStateStore.setHasRequestedPermission(this, permission, false)
              PermissionStateStore.setPermissionPermanentlyDenied(this, permission, false)
            } else {
              val canRequestAgain = ActivityCompat.shouldShowRequestPermissionRationale(activity, permission)
              PermissionStateStore.setPermissionPermanentlyDenied(this, permission, !canRequestAgain)
            }
            continuation.resume(hasPermission)
            return@PermissionListener true
          }
          return@PermissionListener false
        }
      activity.requestPermissions(arrayOf(permission), currentRequestCode, listener)
    } else {
      throw Error("Activity is not a PermissionAwareActivity!")
    }
  }
}
