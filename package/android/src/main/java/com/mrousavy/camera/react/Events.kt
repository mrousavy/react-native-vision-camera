package com.mrousavy.camera.react

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class CameraInitializedEvent(surfaceId: Int, viewId: Int) : Event<CameraInitializedEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData(): WritableMap = Arguments.createMap()
  companion object {
    const val EVENT_NAME = "topInitialized"
  }
}

class CameraStartedEvent(surfaceId: Int, viewId: Int) : Event<CameraStartedEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData(): WritableMap = Arguments.createMap()
  companion object {
    const val EVENT_NAME = "topStarted"
  }
}

class CameraStoppedEvent(surfaceId: Int, viewId: Int) : Event<CameraStoppedEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData(): WritableMap = Arguments.createMap()
  companion object {
    const val EVENT_NAME = "topStopped"
  }
}

class CameraPreviewStartedEvent(surfaceId: Int, viewId: Int) : Event<CameraPreviewStartedEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData(): WritableMap = Arguments.createMap()
  companion object {
    const val EVENT_NAME = "topPreviewStarted"
  }
}

class CameraPreviewStoppedEvent(surfaceId: Int, viewId: Int) : Event<CameraPreviewStoppedEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData(): WritableMap = Arguments.createMap()
  companion object {
    const val EVENT_NAME = "topPreviewStopped"
  }
}

class CameraShutterEvent(surfaceId: Int, viewId: Int, private val data: WritableMap) : Event<CameraShutterEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData() = data
  companion object {
    const val EVENT_NAME = "topShutter"
  }
}

class CameraOutputOrientationChangedEvent(surfaceId: Int, viewId: Int, private val data: WritableMap) :
  Event<CameraOutputOrientationChangedEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData() = data
  companion object {
    const val EVENT_NAME = "topOutputOrientationChanged"
  }
}

class CameraPreviewOrientationChangedEvent(surfaceId: Int, viewId: Int, private val data: WritableMap) :
  Event<CameraPreviewOrientationChangedEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData() = data
  companion object {
    const val EVENT_NAME = "topPreviewOrientationChanged"
  }
}

class AverageFpsChangedEvent(surfaceId: Int, viewId: Int, private val data: WritableMap) : Event<CameraShutterEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData() = data
  companion object {
    const val EVENT_NAME = "topAverageFpsChanged"
  }
}

class CameraErrorEvent(surfaceId: Int, viewId: Int, private val data: WritableMap) : Event<CameraErrorEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData() = data
  companion object {
    const val EVENT_NAME = "topError"
  }
}

class CameraViewReadyEvent(surfaceId: Int, viewId: Int) : Event<CameraViewReadyEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData(): WritableMap = Arguments.createMap()
  companion object {
    const val EVENT_NAME = "topViewReady"
  }
}

class CameraCodeScannedEvent(surfaceId: Int, viewId: Int, private val data: WritableMap) :
  Event<CameraCodeScannedEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME
  override fun getEventData() = data
  companion object {
    const val EVENT_NAME = "topCodeScanned"
  }
}
