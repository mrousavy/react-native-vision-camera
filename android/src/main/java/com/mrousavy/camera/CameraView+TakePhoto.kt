package com.mrousavy.camera

import android.annotation.SuppressLint
import android.hardware.camera2.*
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.mrousavy.camera.utils.*
import kotlinx.coroutines.*

@SuppressLint("UnsafeOptInUsageError")
suspend fun CameraView.takePhoto(options: ReadableMap): WritableMap = coroutineScope {
  // TODO: takePhoto()

  val map = Arguments.createMap()
  return@coroutineScope map
}
