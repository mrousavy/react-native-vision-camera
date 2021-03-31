package com.mrousavy.camera

import android.util.Log
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class CameraViewManager : SimpleViewManager<CameraView>() {
  private fun addChangedPropToTransaction(view: CameraView, changedProp: String) {
    if (cameraViewTransactions[view] == null) {
      cameraViewTransactions[view] = ArrayList()
    }
    cameraViewTransactions[view]!!.add(changedProp)
  }

  @ReactProp(name = "cameraId")
  fun setCameraId(view: CameraView, cameraId: String) {
    if (view.cameraId != cameraId)
      addChangedPropToTransaction(view, "cameraId")
    view.cameraId = cameraId
  }

  @ReactProp(name = "enableDepthData")
  fun setEnableDepthData(view: CameraView, enableDepthData: Boolean) {
    if (view.enableDepthData != enableDepthData)
      addChangedPropToTransaction(view, "enableDepthData")
    view.enableDepthData = enableDepthData
  }

  @ReactProp(name = "enableHighResolutionCapture")
  fun setEnableHighResolutionCapture(view: CameraView, enableHighResolutionCapture: Boolean?) {
    if (view.enableHighResolutionCapture != enableHighResolutionCapture)
      addChangedPropToTransaction(view, "enableHighResolutionCapture")
    view.enableHighResolutionCapture = enableHighResolutionCapture
  }

  @ReactProp(name = "enablePortraitEffectsMatteDelivery")
  fun setEnablePortraitEffectsMatteDelivery(view: CameraView, enablePortraitEffectsMatteDelivery: Boolean) {
    if (view.enablePortraitEffectsMatteDelivery != enablePortraitEffectsMatteDelivery)
      addChangedPropToTransaction(view, "enablePortraitEffectsMatteDelivery")
    view.enablePortraitEffectsMatteDelivery = enablePortraitEffectsMatteDelivery
  }

  @ReactProp(name = "format")
  fun setFormat(view: CameraView, format: ReadableMap?) {
    if (view.format != format)
      addChangedPropToTransaction(view, "format")
    view.format = format
  }

  // We're treating -1 as "null" here, because when I make the fps parameter
  // of type "Int?" the react bridge throws an error.
  @ReactProp(name = "fps", defaultInt = -1)
  fun setFps(view: CameraView, fps: Int) {
    if (view.fps != fps)
      addChangedPropToTransaction(view, "fps")
    view.fps = if (fps > 0) fps else null
  }

  @ReactProp(name = "hdr")
  fun setHdr(view: CameraView, hdr: Boolean?) {
    if (view.hdr != hdr)
      addChangedPropToTransaction(view, "hdr")
    view.hdr = hdr
  }

  @ReactProp(name = "lowLightBoost")
  fun setLowLightBoost(view: CameraView, lowLightBoost: Boolean?) {
    if (view.lowLightBoost != lowLightBoost)
      addChangedPropToTransaction(view, "lowLightBoost")
    view.lowLightBoost = lowLightBoost
  }

  @ReactProp(name = "colorSpace")
  fun setColorSpace(view: CameraView, colorSpace: String?) {
    if (view.colorSpace != colorSpace)
      addChangedPropToTransaction(view, "colorSpace")
    view.colorSpace = colorSpace
  }

  @ReactProp(name = "isActive")
  fun setIsActive(view: CameraView, isActive: Boolean) {
    if (view.isActive != isActive)
      addChangedPropToTransaction(view, "isActive")
    view.isActive = isActive
  }

  @ReactProp(name = "torch")
  fun setTorch(view: CameraView, torch: String) {
    if (view.torch != torch)
      addChangedPropToTransaction(view, "torch")
    view.torch = torch
  }

  @ReactProp(name = "zoom")
  fun setZoom(view: CameraView, zoom: Double) {
    if (view.zoom != zoom)
      addChangedPropToTransaction(view, "zoom")
    view.zoom = zoom
  }

  @ReactProp(name = "enableZoomGesture")
  fun setEnableZoomGesture(view: CameraView, enableZoomGesture: Boolean) {
    if (view.enableZoomGesture != enableZoomGesture)
      addChangedPropToTransaction(view, "enableZoomGesture")
    view.enableZoomGesture = enableZoomGesture
  }

  override fun onAfterUpdateTransaction(view: CameraView) {
    super.onAfterUpdateTransaction(view)
    val changedProps = cameraViewTransactions[view] ?: ArrayList()
    view.update(changedProps)
    cameraViewTransactions.remove(view)
  }

  public override fun createViewInstance(context: ThemedReactContext): CameraView {
    return CameraView(context)
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any>? {
    return MapBuilder.builder<String, Any>()
      .put("cameraInitialized", MapBuilder.of("registrationName", "onInitialized"))
      .put("cameraError", MapBuilder.of("registrationName", "onError"))
      .build()
  }

  override fun onDropViewInstance(view: CameraView) {
    Log.d(REACT_CLASS, "onDropViewInstance() called!")
    super.onDropViewInstance(view)
  }

  override fun getName(): String {
    return REACT_CLASS
  }

  companion object {
    const val REACT_CLASS = "CameraView"

    val cameraViewTransactions: HashMap<CameraView, ArrayList<String>> = HashMap()
  }
}
