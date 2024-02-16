package com.mrousavy.camera

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp
import com.mrousavy.camera.types.CameraDeviceFormat
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
      .put("cameraStarted", MapBuilder.of("registrationName", "onStarted"))
      .put("cameraStopped", MapBuilder.of("registrationName", "onStopped"))
      .put("cameraError", MapBuilder.of("registrationName", "onError"))
      .put("cameraCodeScanned", MapBuilder.of("registrationName", "onCodeScanned"))
      .build()

  override fun getName(): String = TAG

  override fun onDropViewInstance(view: CameraView) {
    view.destroy()
    super.onDropViewInstance(view)
  }

  @ReactProp(name = "cameraId")
  fun setCameraId(view: CameraView, cameraId: String) {
    view.cameraId = cameraId
  }

  @ReactProp(name = "photo")
  fun setPhoto(view: CameraView, photo: Boolean) {
    view.photo = photo
  }

  @ReactProp(name = "video")
  fun setVideo(view: CameraView, video: Boolean) {
    view.video = video
  }

  @ReactProp(name = "audio")
  fun setAudio(view: CameraView, audio: Boolean) {
    view.audio = audio
  }

  @ReactProp(name = "enableFrameProcessor")
  fun setEnableFrameProcessor(view: CameraView, enableFrameProcessor: Boolean) {
    view.enableFrameProcessor = enableFrameProcessor
  }

  @ReactProp(name = "pixelFormat")
  fun setPixelFormat(view: CameraView, pixelFormat: String?) {
    if (pixelFormat != null) {
      val newPixelFormat = PixelFormat.fromUnionValue(pixelFormat)
      view.pixelFormat = newPixelFormat
    } else {
      view.pixelFormat = PixelFormat.NATIVE
    }
  }

  @ReactProp(name = "enableDepthData")
  fun setEnableDepthData(view: CameraView, enableDepthData: Boolean) {
    view.enableDepthData = enableDepthData
  }

  @ReactProp(name = "enableZoomGesture")
  fun setEnableZoomGesture(view: CameraView, enableZoomGesture: Boolean) {
    view.enableZoomGesture = enableZoomGesture
  }

  @ReactProp(name = "enableFpsGraph")
  fun setEnableFpsGraph(view: CameraView, enableFpsGraph: Boolean) {
    view.enableFpsGraph = enableFpsGraph
  }

  @ReactProp(name = "enableGpuBuffers")
  fun setEnableGpuBuffers(view: CameraView, enableGpuBuffers: Boolean) {
    view.enableGpuBuffers = enableGpuBuffers
  }

  @ReactProp(name = "videoStabilizationMode")
  fun setVideoStabilizationMode(view: CameraView, videoStabilizationMode: String?) {
    if (videoStabilizationMode != null) {
      val newMode = VideoStabilizationMode.fromUnionValue(videoStabilizationMode)
      view.videoStabilizationMode = newMode
    } else {
      view.videoStabilizationMode = null
    }
  }

  @ReactProp(name = "enablePortraitEffectsMatteDelivery")
  fun setEnablePortraitEffectsMatteDelivery(view: CameraView, enablePortraitEffectsMatteDelivery: Boolean) {
    view.enablePortraitEffectsMatteDelivery = enablePortraitEffectsMatteDelivery
  }

  @ReactProp(name = "format")
  fun setFormat(view: CameraView, format: ReadableMap?) {
    if (format != null) {
      val newFormat = CameraDeviceFormat.fromJSValue(format)
      view.format = newFormat
    } else {
      view.format = null
    }
  }

  @ReactProp(name = "resizeMode")
  fun setResizeMode(view: CameraView, resizeMode: String?) {
    if (resizeMode != null) {
      val newMode = ResizeMode.fromUnionValue(resizeMode)
      view.resizeMode = newMode
    } else {
      view.resizeMode = ResizeMode.COVER
    }
  }

  // TODO: Change when TurboModules release.
  // We're treating -1 as "null" here, because when I make the fps parameter
  // of type "Int?" the react bridge throws an error.
  @ReactProp(name = "fps", defaultInt = -1)
  fun setFps(view: CameraView, fps: Int) {
    view.fps = if (fps > 0) fps else null
  }

  @ReactProp(name = "photoHdr")
  fun setPhotoHdr(view: CameraView, photoHdr: Boolean) {
    view.photoHdr = photoHdr
  }

  @ReactProp(name = "videoHdr")
  fun setVideoHdr(view: CameraView, videoHdr: Boolean) {
    view.videoHdr = videoHdr
  }

  @ReactProp(name = "lowLightBoost")
  fun setLowLightBoost(view: CameraView, lowLightBoost: Boolean) {
    view.lowLightBoost = lowLightBoost
  }

  @ReactProp(name = "isActive")
  fun setIsActive(view: CameraView, isActive: Boolean) {
    view.isActive = isActive
  }

  @ReactProp(name = "torch")
  fun setTorch(view: CameraView, torch: String?) {
    if (torch != null) {
      val newMode = Torch.fromUnionValue(torch)
      view.torch = newMode
    } else {
      view.torch = Torch.OFF
    }
  }

  @ReactProp(name = "zoom")
  fun setZoom(view: CameraView, zoom: Double) {
    view.zoom = zoom.toFloat()
  }

  @ReactProp(name = "exposure")
  fun setExposure(view: CameraView, exposure: Double) {
    view.exposure = exposure
  }

  @ReactProp(name = "orientation")
  fun setOrientation(view: CameraView, orientation: String?) {
    if (orientation != null) {
      val newMode = Orientation.fromUnionValue(orientation)
      view.orientation = newMode
    } else {
      view.orientation = Orientation.PORTRAIT
    }
  }

  @ReactProp(name = "codeScannerOptions")
  fun setCodeScanner(view: CameraView, codeScannerOptions: ReadableMap?) {
    if (codeScannerOptions != null) {
      val newCodeScannerOptions = CodeScannerOptions.fromJSValue(codeScannerOptions)
      view.codeScannerOptions = newCodeScannerOptions
    } else {
      view.codeScannerOptions = null
    }
  }

  companion object {
    const val TAG = "CameraView"
  }
}
