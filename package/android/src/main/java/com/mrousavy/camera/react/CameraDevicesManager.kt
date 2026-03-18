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
import com.mrousavy.camera.core.CameraQueues
import java.util.concurrent.Callable
import java.util.concurrent.Future

class CameraDevicesManager(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    private const val TAG = "CameraDevices"
  }
  private val executor = CameraQueues.cameraExecutor

  // Because getConstants() and initialize() are only called once for the entire life of the app process by react native.
  // We have to make sure that everything is initialized, otherwise no devices are going to be retrieved ever.
  // Either because getConstants() returns empty, or that the sendAvailableDevicesChangedEvent inside initialize() sends empty as well.
  // We still give the opportunity for device to be initialized between init call and react initialization.
  private val cameraInitializationFuture: Future<CameraInitialization>
  private val cameraManager = reactContext.getSystemService(Context.CAMERA_SERVICE) as CameraManager

  private class CameraInitialization {
    var cameraProvider: ProcessCameraProvider? = null
    var extensionsManager: ExtensionsManager? = null
  }

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
    cameraInitializationFuture = executor.submit(Callable {
      val cameraInitialization = CameraInitialization()
      try {
        Log.i(TAG, "Initializing ProcessCameraProvider...")
        cameraInitialization.cameraProvider = ProcessCameraProvider.getInstance(reactContext).get()
        Log.i(TAG, "Initializing ExtensionsManager...")
        cameraInitialization.extensionsManager = ExtensionsManager.getInstanceAsync(reactContext, cameraInitialization.cameraProvider!!).get()
        Log.i(TAG, "Successfully initialized!")
      } catch (error: Throwable) {
        Log.e(TAG, "Failed to initialize ProcessCameraProvider/ExtensionsManager! Error: ${error.message}", error)
      }
      return@Callable cameraInitialization
    })
  }

  // Note: initialize() will be called after getConstants on new arch!
  override fun initialize() {
    super.initialize()
    cameraManager.registerAvailabilityCallback(callback, null)
    sendAvailableDevicesChangedEvent()
  }

  override fun invalidate() {
    cameraManager.unregisterAvailabilityCallback(callback)
    super.invalidate()
  }

  private fun getDevicesJson(): ReadableArray {
    val devices = Arguments.createArray()

    val cameraProvider = cameraInitializationFuture.get().cameraProvider ?: return devices
    val extensionsManager = cameraInitializationFuture.get().extensionsManager ?: return devices

    cameraProvider.availableCameraInfos.forEach { cameraInfo ->
      val device = CameraDeviceDetails(cameraInfo, extensionsManager)
      devices.pushMap(device.toMap())
    }
    return devices
  }

  // Called by CameraManager.AvailabilityCallback registered after initialize()
  fun sendAvailableDevicesChangedEvent() {
    val eventEmitter = reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
    val devices = getDevicesJson()
    eventEmitter.emit("CameraDevicesChanged", devices)
  }

  // Called by react native only once
  override fun getConstants(): MutableMap<String, Any?> {
    val devices = getDevicesJson()
    val preferredDevice = if (devices.size() > 0) devices.getMap(0) else null

    return mutableMapOf(
      "availableCameraDevices" to devices,
      "userPreferredCameraDevice" to preferredDevice?.toHashMap()
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
