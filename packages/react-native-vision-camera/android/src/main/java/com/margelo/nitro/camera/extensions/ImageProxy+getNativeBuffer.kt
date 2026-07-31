package com.margelo.nitro.camera.extensions

import android.os.Build
import androidx.camera.core.ImageProxy
import com.margelo.nitro.camera.NativeBuffer
import com.margelo.nitro.camera.utils.NativeBufferHelper

val ImageProxy.hasNativeBuffer: Boolean
  get() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
      return false
    }
    hardwareBuffer?.use {
      return true
    }
    return false
  }

fun ImageProxy.getNativeBuffer(): NativeBuffer {
  if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
    throw Error("NativeBuffers are only available on API 28 or higher!")
  }
  val hardwareBuffer =
    hardwareBuffer
      ?: throw Error("Frame does not have a HardwareBuffer!")
  return hardwareBuffer.use { hardwareBuffer ->
    val pointer = NativeBufferHelper.getHardwareBufferPointer(hardwareBuffer)
    var wasReleased = false
    val release = {
      if (wasReleased) {
        throw Error("Tried to release NativeBuffer twice!")
      }
      NativeBufferHelper.releaseHardwareBufferPointer(pointer)
      wasReleased = true
    }
    NativeBuffer(pointer.toULong(), release)
  }
}
