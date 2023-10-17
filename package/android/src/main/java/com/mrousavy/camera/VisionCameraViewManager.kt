package com.mrousavy.camera

import android.graphics.Color
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

@ReactModule(name = VisionCameraViewManager.NAME)
class VisionCameraViewManager :
  VisionCameraViewManagerSpec<VisionCameraView>() {
  override fun getName(): String {
    return NAME
  }

  public override fun createViewInstance(context: ThemedReactContext): VisionCameraView {
    return VisionCameraView(context)
  }

  @ReactProp(name = "color")
  override fun setColor(view: VisionCameraView?, color: String?) {
    view?.setBackgroundColor(Color.parseColor(color))
  }

  companion object {
    const val NAME = "VisionCameraView"
  }
}
