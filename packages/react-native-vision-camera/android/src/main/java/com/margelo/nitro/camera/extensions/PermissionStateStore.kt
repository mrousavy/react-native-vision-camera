package com.margelo.nitro.camera.extensions

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext

internal object PermissionStateStore {
  private const val PREFERENCES_NAME = "visioncamera.permissions"

  fun hasRequestedPermission(
    context: ReactApplicationContext,
    permission: String,
  ): Boolean {
    return context
      .getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
      .getBoolean("$permission.requested", false)
  }

  fun setHasRequestedPermission(
    context: ReactApplicationContext,
    permission: String,
    hasRequestedPermission: Boolean,
  ) {
    context
      .getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
      .edit()
      .putBoolean("$permission.requested", hasRequestedPermission)
      .apply()
  }

  fun isPermissionPermanentlyDenied(
    context: ReactApplicationContext,
    permission: String,
  ): Boolean {
    return context
      .getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
      .getBoolean("$permission.permanentlyDenied", false)
  }

  fun setPermissionPermanentlyDenied(
    context: ReactApplicationContext,
    permission: String,
    isPermanentlyDenied: Boolean,
  ) {
    context
      .getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
      .edit()
      .putBoolean("$permission.permanentlyDenied", isPermanentlyDenied)
      .apply()
  }
}
