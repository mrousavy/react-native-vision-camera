package com.mrousavy.camera.core.extensions

import android.annotation.SuppressLint
import androidx.camera.core.CameraInfo
import androidx.camera.core.impl.CameraInfoInternal

val CameraInfo.id: String?
  @SuppressLint("RestrictedApi")
  get() {
    val infoInternal = this as? CameraInfoInternal
    if (infoInternal != null) {
      return infoInternal.cameraId
    }
    return null
  }
