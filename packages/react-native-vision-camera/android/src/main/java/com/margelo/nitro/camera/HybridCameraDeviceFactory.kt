package com.margelo.nitro.camera

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.camera.camera2.adapter.CameraInfoAdapter.Companion.cameraId
import androidx.camera.core.CameraIdentifier
import androidx.camera.core.CameraPresenceListener
import androidx.camera.core.CameraSelector
import androidx.camera.extensions.ExtensionMode
import androidx.camera.extensions.ExtensionsManager
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.edit
import com.facebook.react.bridge.ReactApplicationContext
import com.margelo.nitro.NitroModules
import com.margelo.nitro.camera.extensions.mapToArray
import com.margelo.nitro.camera.hybrids.inputs.HybridCameraDevice
import com.margelo.nitro.camera.hybrids.inputs.HybridCameraExtension
import com.margelo.nitro.camera.public.NativeCameraDevice
import com.margelo.nitro.camera.utils.IdentifiableExecutor
import com.margelo.nitro.core.Promise

class HybridCameraDeviceFactory(
  val cameraProvider: ProcessCameraProvider,
) : HybridCameraDeviceFactorySpec() {
  companion object {
    private const val PREFERRED_CAMERA_KEY = "preferred_camera_id"
    private val ALL_EXTENSIONS =
      arrayOf(ExtensionMode.HDR, ExtensionMode.BOKEH, ExtensionMode.FACE_RETOUCH, ExtensionMode.NIGHT, ExtensionMode.AUTO)
  }

  private val executor = IdentifiableExecutor("com.margelo.camera.device-factory")
  private val context: ReactApplicationContext
    get() = NitroModules.applicationContext ?: throw Error("No ApplicationContext set!")
  private val sharedPreferences: SharedPreferences
    get() = context.getSharedPreferences("com.margelo.camera", Context.MODE_PRIVATE)

  override val cameraDevices: Array<HybridCameraDeviceSpec>
    get() = cameraProvider.availableCameraInfos.mapToArray { HybridCameraDevice(it) }

  override val supportedMultiCamDeviceCombinations: Array<Array<HybridCameraDeviceSpec>>
    get() {
      return cameraProvider.availableConcurrentCameraInfos.mapToArray { devices ->
        return@mapToArray devices.mapToArray { HybridCameraDevice(it) }
      }
    }

  override var userPreferredCamera: HybridCameraDeviceSpec?
    get() {
      val preferredCameraId =
        sharedPreferences.getString(PREFERRED_CAMERA_KEY, null)
          ?: return null
      return getCameraForId(preferredCameraId)
    }
    set(value) {
      sharedPreferences.edit {
        if (value != null) {
          putString(PREFERRED_CAMERA_KEY, value.id)
        } else {
          remove(PREFERRED_CAMERA_KEY)
        }
      }
    }

  override fun addOnCameraDevicesChangedListener(listener: (Array<HybridCameraDeviceSpec>) -> Unit): ListenerSubscription {
    val presenceListener =
      object : CameraPresenceListener {
        override fun onCamerasAdded(cameraIdentifiers: Set<CameraIdentifier?>) {
          if (cameraIdentifiers.isEmpty()) return
          listener(cameraDevices)
        }

        override fun onCamerasRemoved(cameraIdentifiers: Set<CameraIdentifier?>) {
          if (cameraIdentifiers.isEmpty()) return
          listener(cameraDevices)
        }
      }
    cameraProvider.addCameraPresenceListener(executor, presenceListener)
    return ListenerSubscription({
      cameraProvider.removeCameraPresenceListener(presenceListener)
    })
  }

  override fun getCameraForId(id: String): HybridCameraDeviceSpec? {
    val cameraInfo =
      cameraProvider.availableCameraInfos.firstOrNull { cameraInfo ->
        cameraInfo.cameraId?.value == id
      }
    if (cameraInfo == null) {
      return null
    }
    return HybridCameraDevice(cameraInfo)
  }

  override fun getSupportedExtensions(camera: HybridCameraDeviceSpec): Promise<Array<HybridCameraExtensionSpec>> {
    return Promise.async {
      val camera =
        camera as? NativeCameraDevice
          ?: throw Error("Camera is not an instance of `NativeCameraDevice`!")
      val cameraInfo = camera.cameraInfo

      val extensionsManager = ExtensionsManager.getInstance(context, cameraProvider)

      val availableExtensions = ALL_EXTENSIONS.filter { extensionsManager.isExtensionAvailable(cameraInfo.cameraSelector, it) }
      return@async availableExtensions.mapToArray { mode ->
        return@mapToArray HybridCameraExtension(cameraInfo, extensionsManager, mode)
      }
    }
  }

  override fun getDefaultCamera(position: CameraPosition): HybridCameraDeviceSpec? {
    val selector =
      when (position) {
        CameraPosition.FRONT -> CameraSelector.DEFAULT_FRONT_CAMERA
        CameraPosition.BACK -> CameraSelector.DEFAULT_BACK_CAMERA
        else -> return null
      }
    try {
      val defaultCamera = cameraProvider.getCameraInfo(selector)
      return HybridCameraDevice(defaultCamera)
    } catch (e: Throwable) {
      Log.e(TAG, "No default ${position.name} Camera found!", e)
      return null
    }
  }
}
