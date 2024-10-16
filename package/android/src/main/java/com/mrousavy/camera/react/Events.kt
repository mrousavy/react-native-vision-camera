package com.mrousavy.camera.react

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class CameraInitializedEvent(surfaceId: Int, viewId: Int) : Event<CameraInitializedEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData(): WritableMap = Arguments.createMap()
  companion object {
    const val EVENT_NAME = "topCameraInitialized"
  }
}

class CameraStartedEvent(surfaceId: Int, viewId: Int) : Event<CameraStartedEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData(): WritableMap = Arguments.createMap()
  companion object {
    const val EVENT_NAME = "topCameraStarted"
  }
}

class CameraStoppedEvent(surfaceId: Int, viewId: Int) : Event<CameraStoppedEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData(): WritableMap = Arguments.createMap()
  companion object {
    const val EVENT_NAME = "topCameraStopped"
  }
}

class CameraPreviewStartedEvent(surfaceId: Int, viewId: Int) : Event<CameraPreviewStartedEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData(): WritableMap = Arguments.createMap()
  companion object {
    const val EVENT_NAME = "topCameraPreviewStarted"
  }
}

class CameraPreviewStoppedEvent(surfaceId: Int, viewId: Int) : Event<CameraPreviewStoppedEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData(): WritableMap = Arguments.createMap()
  companion object {
    const val EVENT_NAME = "topCameraPreviewStopped"
  }
}

class CameraShutterEvent(surfaceId: Int, viewId: Int, private val data: WritableMap) : Event<CameraShutterEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData() = data
  companion object {
    const val EVENT_NAME = "topCameraShutter"
  }
}

class CameraOutputOrientationChangedEvent(surfaceId: Int, viewId: Int, private val data: WritableMap) :
  Event<CameraOutputOrientationChangedEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData() = data
  companion object {
    const val EVENT_NAME = "topCameraOutputOrientationChanged"
  }
}

class CameraPreviewOrientationChangedEvent(surfaceId: Int, viewId: Int, private val data: WritableMap) :
  Event<CameraPreviewOrientationChangedEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData() = data
  companion object {
    const val EVENT_NAME = "topCameraPreviewOrientationChanged"
  }
}

class AverageFpsChangedEvent(surfaceId: Int, viewId: Int, private val data: WritableMap) : Event<CameraShutterEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData() = data
  companion object {
    const val EVENT_NAME = "topCameraAverageFpsChanged"
  }
}

class CameraErrorEvent(surfaceId: Int, viewId: Int, private val data: WritableMap) : Event<CameraErrorEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData() = data
  companion object {
    const val EVENT_NAME = "topCameraError"
  }
}

class CameraViewReadyEvent(surfaceId: Int, viewId: Int) : Event<CameraViewReadyEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData(): WritableMap = Arguments.createMap()
  companion object {
    const val EVENT_NAME = "topCameraViewReady"
  }
}

class CameraCodeScannedEvent(surfaceId: Int, viewId: Int, private val data: WritableMap) :
  Event<CameraCodeScannedEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData() = data
  companion object {
    const val EVENT_NAME = "topCameraCodeScanned"
  }
}
