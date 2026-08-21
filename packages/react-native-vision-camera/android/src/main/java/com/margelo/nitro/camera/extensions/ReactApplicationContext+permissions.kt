package com.margelo.nitro.camera.extensions

import android.content.pm.PackageManager
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.PermissionAwareActivity
import com.margelo.nitro.camera.PermissionStatus

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

suspend fun ReactApplicationContext.requestPermission(permission: String): Boolean {
  val activity = currentActivity ?: throw Error("No Activity!")
  if (activity !is PermissionAwareActivity) {
    throw Error("Activity is not a PermissionAwareActivity!")
  }

  PermissionStateStore.setHasRequestedPermission(this, permission, true)
  val grantResults = PermissionRequestDispatcher.request(activity, permission)
  if (grantResults.isEmpty()) {
    // Android cancelled the request without ever asking the user, so we did not learn anything
    // new about this permission - don't remember it as denied.
    return false
  }

  val hasPermission = grantResults.first() == PackageManager.PERMISSION_GRANTED
  if (hasPermission) {
    PermissionStateStore.setHasRequestedPermission(this, permission, false)
    PermissionStateStore.setPermissionPermanentlyDenied(this, permission, false)
  } else {
    val canRequestAgain = ActivityCompat.shouldShowRequestPermissionRationale(activity, permission)
    PermissionStateStore.setPermissionPermanentlyDenied(this, permission, !canRequestAgain)
  }
  return hasPermission
}
