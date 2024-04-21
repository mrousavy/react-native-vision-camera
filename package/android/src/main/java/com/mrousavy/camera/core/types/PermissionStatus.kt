package com.mrousavy.camera.core.types

import android.content.pm.PackageManager

enum class PermissionStatus(override val unionValue: String) : JSUnionValue {
  DENIED("denied"),
  NOT_DETERMINED("not-determined"),
  GRANTED("granted");

  companion object {
    fun fromPermissionStatus(status: Int): PermissionStatus =
      when (status) {
        PackageManager.PERMISSION_DENIED -> DENIED
        PackageManager.PERMISSION_GRANTED -> GRANTED
        else -> NOT_DETERMINED
      }
  }
}
