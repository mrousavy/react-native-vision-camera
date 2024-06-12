package com.mrousavy.camera.react

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

class CameraPreviewStartedEvent(surfaceId: Int, viewId: Int) : Event<CameraPreviewStartedEvent>(surfaceId, viewId) {
  override fun getEventName() = "cameraPreviewStarted"
  override fun getEventData(): WritableMap = Arguments.createMap()
}

class CameraPreviewStoppedEvent(surfaceId: Int, viewId: Int) : Event<CameraPreviewStoppedEvent>(surfaceId, viewId) {
  override fun getEventName() = "cameraPreviewStopped"
  override fun getEventData(): WritableMap = Arguments.createMap()
}

class CameraShutterEvent(surfaceId: Int, viewId: Int, private val data: WritableMap) : Event<CameraShutterEvent>(surfaceId, viewId) {
  override fun getEventName() = "cameraShutter"
  override fun getEventData() = data
}

class CameraOutputOrientationChangedEvent(surfaceId: Int, viewId: Int, private val data: WritableMap) :
  Event<CameraOutputOrientationChangedEvent>(surfaceId, viewId) {
  override fun getEventName() = "cameraOutputOrientationChanged"
  override fun getEventData() = data
}

class CameraPreviewOrientationChangedEvent(surfaceId: Int, viewId: Int, private val data: WritableMap) :
  Event<CameraPreviewOrientationChangedEvent>(surfaceId, viewId) {
  override fun getEventName() = "cameraPreviewOrientationChanged"
  override fun getEventData() = data
}

class AverageFpsChangedEvent(surfaceId: Int, viewId: Int, private val data: WritableMap) : Event<CameraShutterEvent>(surfaceId, viewId) {
  override fun getEventName() = "averageFpsChanged"
  override fun getEventData() = data
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
