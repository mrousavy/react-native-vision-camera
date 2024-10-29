package com.mrousavy.camera.react

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

class CameraPackage : TurboReactPackage() {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(
      CameraViewModule(reactContext),
      CameraDevicesManager(reactContext)
    )

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = listOf(CameraViewManager())

  override fun getModule(name: String, context: ReactApplicationContext): NativeModule? {
    return when (name) {
      CameraViewModule.TAG -> CameraViewModule(context)
      CameraDevicesManager.TAG -> CameraDevicesManager(context)
      else -> null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      val moduleInfos: MutableMap<String, ReactModuleInfo> = HashMap()

      moduleInfos[CameraViewModule.TAG] = ReactModuleInfo(
        CameraViewModule.TAG,
        CameraViewModule.TAG,
        canOverrideExistingModule = false,
        needsEagerInit = true,
        hasConstants = true,
        isCxxModule = false,
        isTurboModule = false
      )

      moduleInfos[CameraDevicesManager.TAG] = ReactModuleInfo(
        CameraDevicesManager.TAG,
        CameraDevicesManager.TAG,
        canOverrideExistingModule = false,
        needsEagerInit = true,
        hasConstants = true,
        isCxxModule = false,
        isTurboModule = false
      )

      moduleInfos
    }
  }
}
