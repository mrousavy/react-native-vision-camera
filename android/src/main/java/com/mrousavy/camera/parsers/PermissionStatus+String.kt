package com.mrousavy.camera.parsers

import android.content.pm.PackageManager

fun parsePermissionStatus(status: Int): String {
  return when (status) {
    PackageManager.PERMISSION_DENIED -> "denied"
    PackageManager.PERMISSION_GRANTED -> "authorized"
    else -> "not-determined"
  }
}
