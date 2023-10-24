package com.mrousavy.camera

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp
import com.mrousavy.camera.types.CodeScannerOptions
import com.mrousavy.camera.types.Orientation
import com.mrousavy.camera.types.PixelFormat
import com.mrousavy.camera.types.ResizeMode
import com.mrousavy.camera.types.Torch
import com.mrousavy.camera.types.VideoStabilizationMode

@Suppress("unused")
class CameraViewManager : ViewGroupManager<CameraView>() {
  public override fun createViewInstance(context: ThemedReactContext): CameraView = CameraView(context)

  override fun onAfterUpdateTransaction(view: CameraView) {
    super.onAfterUpdateTransaction(view)
    view.update()
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any>? =
    MapBuilder.builder<String, Any>()
      .put("cameraViewReady", MapBuilder.of("registrationName", "onViewReady"))
      .put("cameraInitialized", MapBuilder.of("registrationName", "onInitialized"))
      .put("cameraError", MapBuilder.of("registrationName", "onError"))
      .put("cameraCodeScanned", MapBuilder.of("registrationName", "onCodeScanned"))
      .build()

  override fun getName(): String = TAG

  @ReactProp(name = "cameraId")
  fun setCameraId(view: CameraView, cameraId: String) {
    view.cameraId = cameraId
  }

  @ReactProp(name = "photo")
  fun setPhoto(view: CameraView, photo: Boolean?) {
    view.photo = photo
  }

  @ReactProp(name = "video")
  fun setVideo(view: CameraView, video: Boolean?) {
    view.video = video
  }

  @ReactProp(name = "audio")
  fun setAudio(view: CameraView, audio: Boolean?) {
    view.audio = audio
  }

  @ReactProp(name = "enableFrameProcessor")
  fun setEnableFrameProcessor(view: CameraView, enableFrameProcessor: Boolean) {
    view.enableFrameProcessor = enableFrameProcessor
  }

  @ReactProp(name = "pixelFormat")
  fun setPixelFormat(view: CameraView, pixelFormat: String?) {
    val newPixelFormat = PixelFormat.fromUnionValue(pixelFormat)
    view.pixelFormat = newPixelFormat
  }

  @ReactProp(name = "enableDepthData")
  fun setEnableDepthData(view: CameraView, enableDepthData: Boolean) {
    view.enableDepthData = enableDepthData
  }

  @ReactProp(name = "enableZoomGesture")
  fun setEnableZoomGesture(view: CameraView, enableZoomGesture: Boolean) {
    view.enableZoomGesture = enableZoomGesture
  }

  @ReactProp(name = "videoStabilizationMode")
  fun setVideoStabilizationMode(view: CameraView, videoStabilizationMode: String?) {
    val newMode = VideoStabilizationMode.fromUnionValue(videoStabilizationMode)
    view.videoStabilizationMode = newMode
  }

  @ReactProp(name = "enableHighQualityPhotos")
  fun setEnableHighQualityPhotos(view: CameraView, enableHighQualityPhotos: Boolean?) {
    view.enableHighQualityPhotos = enableHighQualityPhotos
  }

  @ReactProp(name = "enablePortraitEffectsMatteDelivery")
  fun setEnablePortraitEffectsMatteDelivery(view: CameraView, enablePortraitEffectsMatteDelivery: Boolean) {
    view.enablePortraitEffectsMatteDelivery = enablePortraitEffectsMatteDelivery
  }

  @ReactProp(name = "format")
  fun setFormat(view: CameraView, format: ReadableMap?) {
    view.format = format
  }

  @ReactProp(name = "resizeMode")
  fun setResizeMode(view: CameraView, resizeMode: String) {
    val newMode = ResizeMode.fromUnionValue(resizeMode)
    view.resizeMode = newMode
  }

  // TODO: Change when TurboModules release.
  // We're treating -1 as "null" here, because when I make the fps parameter
  // of type "Int?" the react bridge throws an error.
  @ReactProp(name = "fps", defaultInt = -1)
  fun setFps(view: CameraView, fps: Int) {
    view.fps = if (fps > 0) fps else null
  }

  @ReactProp(name = "hdr")
  fun setHdr(view: CameraView, hdr: Boolean?) {
    view.hdr = hdr
  }

  @ReactProp(name = "lowLightBoost")
  fun setLowLightBoost(view: CameraView, lowLightBoost: Boolean?) {
    view.lowLightBoost = lowLightBoost
  }

  @ReactProp(name = "isActive")
  fun setIsActive(view: CameraView, isActive: Boolean) {
    view.isActive = isActive
  }

  @ReactProp(name = "torch")
  fun setTorch(view: CameraView, torch: String) {
    val newMode = Torch.fromUnionValue(torch)
    view.torch = newMode
  }

  @ReactProp(name = "zoom")
  fun setZoom(view: CameraView, zoom: Double) {
    val zoomFloat = zoom.toFloat()
    view.zoom = zoomFloat
  }

  @ReactProp(name = "orientation")
  fun setOrientation(view: CameraView, orientation: String?) {
    val newMode = Orientation.fromUnionValue(orientation)
    view.orientation = newMode
  }

  @ReactProp(name = "codeScannerOptions")
  fun setCodeScanner(view: CameraView, codeScannerOptions: ReadableMap) {
    val newCodeScannerOptions = CodeScannerOptions(codeScannerOptions)
    view.codeScannerOptions = newCodeScannerOptions
  }

  companion object {
    const val TAG = "CameraView"
  }
}
