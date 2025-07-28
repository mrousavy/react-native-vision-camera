package com.mrousavy.camera.react

import android.content.Context
import android.hardware.camera2.CameraManager
import android.util.Log
import androidx.camera.extensions.ExtensionsManager
import androidx.camera.lifecycle.ProcessCameraProvider
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.mrousavy.camera.core.CameraDeviceDetails
import android.media.AudioDeviceInfo
import android.media.AudioManager
import com.mrousavy.camera.core.CameraQueues
import com.mrousavy.camera.core.extensions.await
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.launch

class CameraDevicesManager(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    private const val TAG = "CameraDevices"

    fun getAudioDeviceType(deviceInfo: AudioDeviceInfo): String {
      return when (deviceInfo.type) {
        AudioDeviceInfo.TYPE_BLUETOOTH_A2DP,
        AudioDeviceInfo.TYPE_BLUETOOTH_SCO -> "bluetooth-microphone"
        AudioDeviceInfo.TYPE_BUILTIN_MIC -> "built-in-microphone"
        AudioDeviceInfo.TYPE_EXTERNAL,
        AudioDeviceInfo.TYPE_USB_DEVICE,
        AudioDeviceInfo.TYPE_USB_HEADSET -> "external-microphone"
        else -> "unknown"
      }
    }
  }
  private val executor = CameraQueues.cameraExecutor
  private val coroutineScope = CoroutineScope(executor.asCoroutineDispatcher())
  private val cameraManager = reactContext.getSystemService(Context.CAMERA_SERVICE) as CameraManager
  private var cameraProvider: ProcessCameraProvider? = null
  private var extensionsManager: ExtensionsManager? = null

  private val callback = object : CameraManager.AvailabilityCallback() {
    private var deviceIds = cameraManager.cameraIdList.toMutableList()

    // Check if device is still physically connected (even if onCameraUnavailable() is called)
    private fun isDeviceConnected(cameraId: String): Boolean =
      try {
        cameraManager.getCameraCharacteristics(cameraId)
        true
      } catch (_: Throwable) {
        false
      }

    override fun onCameraAvailable(cameraId: String) {
      Log.i(TAG, "Camera #$cameraId is now available.")
      if (!deviceIds.contains(cameraId)) {
        deviceIds.add(cameraId)
        sendAvailableDevicesChangedEvent()
      }
    }

    override fun onCameraUnavailable(cameraId: String) {
      Log.i(TAG, "Camera #$cameraId is now unavailable.")
      if (deviceIds.contains(cameraId) && !isDeviceConnected(cameraId)) {
        deviceIds.remove(cameraId)
        sendAvailableDevicesChangedEvent()
      }
    }
  }

  override fun getName(): String = TAG

  // Init cameraProvider + manager as early as possible
  init {
    coroutineScope.launch {
      try {
        Log.i(TAG, "Initializing ProcessCameraProvider...")
        cameraProvider = ProcessCameraProvider.getInstance(reactContext).await(executor)
        Log.i(TAG, "Initializing ExtensionsManager...")
        extensionsManager = ExtensionsManager.getInstanceAsync(reactContext, cameraProvider!!).await(executor)
        Log.i(TAG, "Successfully initialized!")
      } catch (error: Throwable) {
        Log.e(TAG, "Failed to initialize ProcessCameraProvider/ExtensionsManager! Error: ${error.message}", error)
      }
      sendAvailableDevicesChangedEvent()
    }
  }

  // Note: initialize() will be called after getConstants on new arch!
  override fun initialize() {
    super.initialize()
    cameraManager.registerAvailabilityCallback(callback, null)
  }

  override fun invalidate() {
    cameraManager.unregisterAvailabilityCallback(callback)
    super.invalidate()
  }

  private fun getDevicesJson(): ReadableArray {
    val devices = Arguments.createArray()
    val cameraProvider = cameraProvider ?: return devices
    val extensionsManager = extensionsManager ?: return devices

    cameraProvider.availableCameraInfos.forEach { cameraInfo ->
      val device = CameraDeviceDetails(cameraInfo, extensionsManager)
      devices.pushMap(device.toMap())
    }
    return devices
  }

  fun sendAvailableDevicesChangedEvent() {
    val eventEmitter = reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
    val devices = getDevicesJson()
    eventEmitter.emit("CameraDevicesChanged", devices)
  }

  private fun getAudioDevicesJson(): ReadableArray {
    val devices = Arguments.createArray()
    val audioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    val audioDevices = audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS)
    for (device in audioDevices) {
      val map = Arguments.createMap()
      map.putString("id", device.id.toString())
      map.putString("type", getAudioDeviceType(device))
      map.putString("name", device.productName)
      devices.pushMap(map)
    }
    return devices
  }

  override fun getConstants(): MutableMap<String, Any?> {
    val cameraDevices = getDevicesJson()
    val audioDevices = getAudioDevicesJson()
    val preferredCameraDevice = if (cameraDevices.size() > 0) cameraDevices.getMap(0) else null

    return mutableMapOf(
      "availableCameraDevices" to cameraDevices,
      "availableAudioDevices" to audioDevices,
      "userPreferredCameraDevice" to preferredCameraDevice?.toHashMap()
    )
  }

  // Required for NativeEventEmitter, this is just a dummy implementation:
  @Suppress("unused", "UNUSED_PARAMETER")
  @ReactMethod
  fun addListener(eventName: String) {}

  @Suppress("unused", "UNUSED_PARAMETER")
  @ReactMethod
  fun removeListeners(count: Int) {}
}
