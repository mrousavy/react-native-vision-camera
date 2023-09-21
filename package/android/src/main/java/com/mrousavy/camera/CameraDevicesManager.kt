package com.mrousavy.camera

import android.content.Context
import android.hardware.camera2.CameraManager
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.mrousavy.camera.core.CameraDeviceDetails

class CameraDevicesManager(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    private const val TAG = "CameraDevices"
  }
  private val cameraManager = reactContext.getSystemService(Context.CAMERA_SERVICE) as CameraManager

  private val callback = object : CameraManager.AvailabilityCallback() {
    private var devices = cameraManager.cameraIdList.toMutableList()

    // Check if device is still physically connected (even if onCameraUnavailable() is called)
    private fun isDeviceConnected(cameraId: String): Boolean =
      try {
        cameraManager.getCameraCharacteristics(cameraId)
        true
      } catch (_: Throwable) {
        false
      }

    override fun onCameraAvailable(cameraId: String) {
      Log.i(TAG, "Camera #$cameraId: Available!")
      if (!devices.contains(cameraId)) {
        devices.add(cameraId)
        sendAvailableDevicesChangedEvent()
      }
    }

    override fun onCameraUnavailable(cameraId: String) {
      Log.i(TAG, "Camera #$cameraId: Unavailable!")
      if (devices.contains(cameraId) && !isDeviceConnected(cameraId)) {
        devices.remove(cameraId)
        sendAvailableDevicesChangedEvent()
      }
    }
  }

  override fun getName(): String = TAG

  override fun initialize() {
    cameraManager.registerAvailabilityCallback(callback, null)
  }

  override fun invalidate() {
    cameraManager.unregisterAvailabilityCallback(callback)
    super.invalidate()
  }

  private fun getDevicesJson(): ReadableArray {
    val devices = Arguments.createArray()
    cameraManager.cameraIdList.forEach { cameraId ->
      val device = CameraDeviceDetails(cameraManager, cameraId)
      devices.pushMap(device.toMap())
    }
    return devices
  }

  fun sendAvailableDevicesChangedEvent() {
    val eventEmitter = reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
    eventEmitter.emit("CameraDevicesChanged", getDevicesJson())
  }

  override fun hasConstants(): Boolean = true

  override fun getConstants(): MutableMap<String, Any> = mutableMapOf("availableCameraDevices" to getDevicesJson())

  // Required for NativeEventEmitter, this is just a dummy implementation:
  @ReactMethod
  fun addListener(eventName: String) {}

  @ReactMethod
  fun removeListeners(count: Int) {}
}
