package com.mrousavy.camera.core

import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraDevice
import android.util.Log
import kotlinx.coroutines.sync.Mutex

/**
 * A wrapper around [CameraDevice] and [CameraCaptureSession] to allow for easier and safer Camera usage,
 * safe handling of interruptions, and error handling.
 */
class CaptureSession {
  companion object {
    private const val TAG = "CaptureSession"
  }
  private var device: CameraDevice? = null
  private var session: CameraCaptureSession? = null
  private val mutex = Mutex(false)

  var isActive: Boolean = false

  suspend fun beginConfiguration() {
    Log.i(TAG, "Beginning Session Configuration...")
    mutex.lock()
  }

  fun commitConfiguration() {
    Log.i(TAG, "Committing Session Configuration...")
    if (mutex.isLocked) {
      mutex.unlock()
    }
  }


}
