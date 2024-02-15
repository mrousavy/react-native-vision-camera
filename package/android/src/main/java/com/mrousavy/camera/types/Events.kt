package com.mrousavy.camera.types

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class CameraInitializedEvent(surfaceId: Int, viewId: Int) : Event<CameraInitializedEvent>(surfaceId, viewId) {
  override fun getEventName() = "cameraInitialized"
  override fun getEventData(): WritableMap = Arguments.createMap()
}

class CameraStartedEvent(surfaceId: Int, viewId: Int) : Event<CameraStartedEvent>(surfaceId, viewId) {
  override fun getEventName() = "cameraStarted"
  override fun getEventData(): WritableMap = Arguments.createMap()
}

class CameraStoppedEvent(surfaceId: Int, viewId: Int) : Event<CameraStoppedEvent>(surfaceId, viewId) {
  override fun getEventName() = "cameraStopped"
  override fun getEventData(): WritableMap = Arguments.createMap()
}

class CameraErrorEvent(surfaceId: Int, viewId: Int, private val data: WritableMap) : Event<CameraErrorEvent>(surfaceId, viewId) {
  override fun getEventName() = "cameraError"
  override fun getEventData() = data
}

class CameraViewReadyEvent(surfaceId: Int, viewId: Int) : Event<CameraViewReadyEvent>(surfaceId, viewId) {
  override fun getEventName() = "cameraViewReady"
  override fun getEventData(): WritableMap = Arguments.createMap()
}

class CameraCodeScannedEvent(surfaceId: Int, viewId: Int, private val data: WritableMap) :
  Event<CameraCodeScannedEvent>(surfaceId, viewId) {
  override fun getEventName() = "cameraCodeScanned"
  override fun getEventData() = data
}
