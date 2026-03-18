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
import com.mrousavy.camera.core.extensions.await
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.launch

class CameraDevicesManager(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    private const val TAG = "CameraDevices"
  }
  private val executor = CameraQueues.cameraExecutor
  private val coroutineScope = CoroutineScope(executor.asCoroutineDispatcher())
  private val cameraManager = reactContext.getSystemService(Context.CAMERA_SERVICE) as CameraManager
  private var cameraProvider: ProcessCameraProvider? = null
  private var extensionsManager: ExtensionsManager? = null
  private var pendingDevices: ReadableArray? = null

  private val callback = object : CameraManager.AvailabilityCallback() {
    private var deviceIds = cameraManager.cameraIdList.toMutableList()

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
        safeSendAvailableDevicesChangedEvent()
      }
    }

    override fun onCameraUnavailable(cameraId: String) {
      Log.i(TAG, "Camera #$cameraId is now unavailable.")
      if (deviceIds.contains(cameraId) && !isDeviceConnected(cameraId)) {
        deviceIds.remove(cameraId)
        safeSendAvailableDevicesChangedEvent()
      }
    }
  }

  override fun getName(): String = TAG

  // removed the init { } block — initialization now happens in initialize()

  override fun initialize() {
    super.initialize()

    // Register availability callback immediately so we don't miss events
    cameraManager.registerAvailabilityCallback(callback, null)

    // Do the heavy camera provider + extensions init on the background executor
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

      // Safe send (will buffer if JS not yet ready)
      safeSendAvailableDevicesChangedEvent()
    }

    // If anything was buffered before (rare), attempt to deliver it here also
    pendingDevices?.let {
      try {
        val emitter = reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
        emitter.emit("CameraDevicesChanged", it)
      } catch (e: IllegalStateException) {
        Log.w(TAG, "JS still not ready in initialize(): ${e.message}")
      } finally {
        pendingDevices = null
      }
    }
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

  /**
   * Safe send: if JS is ready, emit immediately; otherwise buffer for later.
   */
  private fun safeSendAvailableDevicesChangedEvent() {
    val devices = getDevicesJson()
    if (reactContext.hasActiveCatalystInstance()) {
      try {
        val eventEmitter = reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
        eventEmitter.emit("CameraDevicesChanged", devices)
      } catch (e: IllegalStateException) {
        Log.w(TAG, "Race condition while emitting CameraDevicesChanged: ${e.message}")
        pendingDevices = devices
      }
    } else {
      Log.i(TAG, "Buffering CameraDevicesChanged until JS is ready")
      pendingDevices = devices
    }
  }

  // keep this simple wrapper to avoid accidental direct calls elsewhere
  fun sendAvailableDevicesChangedEvent() = safeSendAvailableDevicesChangedEvent()

  override fun getConstants(): MutableMap<String, Any?> {
    val devices = getDevicesJson()
    val preferredDevice = if (devices.size() > 0) devices.getMap(0) else null

    return mutableMapOf(
      "availableCameraDevices" to devices,
      "userPreferredCameraDevice" to preferredDevice?.toHashMap()
    )
  }

  @Suppress("unused", "UNUSED_PARAMETER")
  @ReactMethod
  fun addListener(eventName: String) {}

  @Suppress("unused", "UNUSED_PARAMETER")
  @ReactMethod
  fun removeListeners(count: Int) {}
}
