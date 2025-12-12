package com.mrousavy.camera.react

import android.content.Context
import android.util.Log
import android.media.AudioDeviceCallback
import android.media.AudioManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.facebook.react.modules.core.PermissionAwareActivity

private fun isMicrophoneDevice(type: Int): Boolean {
  return when (type) {
    android.media.AudioDeviceInfo.TYPE_BUILTIN_MIC,
    android.media.AudioDeviceInfo.TYPE_WIRED_HEADSET,
    android.media.AudioDeviceInfo.TYPE_BLE_HEADSET,
    android.media.AudioDeviceInfo.TYPE_USB_DEVICE,
    android.media.AudioDeviceInfo.TYPE_BLUETOOTH_A2DP,
    android.media.AudioDeviceInfo.TYPE_USB_HEADSET -> true

    else -> false
  }
}

private fun deviceTypeToString(type: Int): String {
  return when (type) {
    android.media.AudioDeviceInfo.TYPE_BUILTIN_MIC -> "BUILTIN_MIC"
    android.media.AudioDeviceInfo.TYPE_WIRED_HEADSET -> "WIRED_HEADSET"
    android.media.AudioDeviceInfo.TYPE_BLE_HEADSET -> "BLUETOOTH_HEADSET"
    android.media.AudioDeviceInfo.TYPE_USB_DEVICE -> "USB_DEVICE"
    android.media.AudioDeviceInfo.TYPE_USB_HEADSET -> "TYPE_USB_HEADSET"
    android.media.AudioDeviceInfo.TYPE_AUX_LINE -> "AUX_LINE"
    else -> "UNKNOWN"
  }
}

class AudioInputDevicesManager(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  private val devicesChangedEventName = "AudioInputDevicesChanged"
  private var deviceCallback: AudioDeviceCallback? = null
  private val audioManager: AudioManager =
    reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager

  companion object {
    private val TAG = "AudioInputDevices"
  }

  init {
    super.initialize()
  }

  override fun getName(): String = TAG

  private fun canRequestPermission(permission: String): Boolean {
    val activity = reactApplicationContext.currentActivity as? PermissionAwareActivity
    return activity?.shouldShowRequestPermissionRationale(permission) ?: false
  }

  private fun getDevicesJson(): ReadableArray {
    val devices = Arguments.createArray()
    val inputs = audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS)

    for (input in inputs) {
      if (!isMicrophoneDevice(input.type)) continue

      val map = Arguments.createMap()
      map.putString("portName", input.productName?.toString() ?: "Unknown")
      map.putString("portType", deviceTypeToString(input.type))
      map.putString("uid", input.id.toString())
      devices.pushMap(map)
    }

    return devices
  }

  fun sendAvailableDevicesChangedEvent() {
    val eventEmitter = reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
    val devices = getDevicesJson()

    eventEmitter.emit(devicesChangedEventName, devices)
  }

  override fun getConstants(): MutableMap<String, Any?> {
    val devices = getDevicesJson()
    return mutableMapOf(
      "availableAudioInputDevices" to devices,
    )
  }

  @Suppress("unused", "UNUSED_PARAMETER")
  @ReactMethod
  fun addListener(eventName: String) {
    if (deviceCallback == null) {
      deviceCallback = object : AudioDeviceCallback() {

        override fun onAudioDevicesAdded(addedDevices: Array<out android.media.AudioDeviceInfo>) {
          Log.d(TAG, "onAudioDevicesAdded")

          sendAvailableDevicesChangedEvent()
        }
        override fun onAudioDevicesRemoved(removedDevices: Array<out android.media.AudioDeviceInfo>) {
          Log.d(TAG, "onAudioDevicesRemoved")
          sendAvailableDevicesChangedEvent()
        }
      }
      audioManager.registerAudioDeviceCallback(deviceCallback!!, null)
      Log.d(TAG, "Audio device listener registered")
    }
  }

  @Suppress("unused", "UNUSED_PARAMETER")
  @ReactMethod
  fun removeListeners(count: Int) {
    deviceCallback?.let {
      audioManager.unregisterAudioDeviceCallback(it)
      deviceCallback = null
      Log.d(TAG, "removeListeners listener ran")

      Log.d(TAG, "Audio device listener unregistered")
    }
  }
}
