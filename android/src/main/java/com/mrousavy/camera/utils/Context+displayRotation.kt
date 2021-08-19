package com.mrousavy.camera.utils

import android.content.Context
import android.os.Build
import android.view.Surface
import android.view.WindowManager
import com.facebook.react.bridge.ReactContext

val Context.displayRotation: Int
  get() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      this.display?.let { display ->
        return display.rotation
      }
    }

    val windowManager = getSystemService(Context.WINDOW_SERVICE) as? WindowManager
    if (windowManager != null) {
      @Suppress("DEPRECATION") // deprecated since SDK 30
      windowManager.defaultDisplay?.let { display ->
        return display.rotation
      }
    }

    if (this is ReactContext && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      currentActivity?.display?.let { display ->
        return display.rotation
      }
    }

    return Surface.ROTATION_0
  }
