package com.mrousavy.camera

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import kotlinx.coroutines.coroutineScope

suspend fun CameraView.takeSnapshot(options: ReadableMap): WritableMap = coroutineScope {
  // TODO: takeSnapshot()

  val map = Arguments.createMap()
  return@coroutineScope map
}
