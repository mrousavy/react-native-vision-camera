package com.margelo.nitro.camera

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager
import com.margelo.nitro.camera.views.HybridFrameRendererViewManager
import com.margelo.nitro.camera.views.HybridPreviewViewManager

class VisionCameraPackage : BaseReactPackage() {
  override fun getModule(
    name: String,
    reactContext: ReactApplicationContext,
  ): NativeModule? = null

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider { HashMap() }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<in Nothing, in Nothing>> {
    return listOf(HybridPreviewViewManager(), HybridFrameRendererViewManager())
  }

  companion object {
    init {
      VisionCameraOnLoad.initializeNative()
    }
  }
}
