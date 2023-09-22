package com.mrousavy.camera

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp
import com.mrousavy.camera.parsers.Orientation
import com.mrousavy.camera.parsers.PixelFormat
import com.mrousavy.camera.parsers.ResizeMode
import com.mrousavy.camera.parsers.Torch
import com.mrousavy.camera.parsers.VideoStabilizationMode

@Suppress("unused")
class CameraViewManager : ViewGroupManager<CameraView>() {
  public override fun createViewInstance(context: ThemedReactContext): CameraView = CameraView(context)

  override fun onAfterUpdateTransaction(view: CameraView) {
    super.onAfterUpdateTransaction(view)
    val changedProps = cameraViewTransactions[view] ?: ArrayList()
    view.update(changedProps)
    cameraViewTransactions.remove(view)
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any>? =
    MapBuilder.builder<String, Any>()
      .put("cameraViewReady", MapBuilder.of("registrationName", "onViewReady"))
      .put("cameraInitialized", MapBuilder.of("registrationName", "onInitialized"))
      .put("cameraError", MapBuilder.of("registrationName", "onError"))
      .build()

  override fun getName(): String = TAG

  @ReactProp(name = "cameraId")
  fun setCameraId(view: CameraView, cameraId: String) {
    if (view.cameraId != cameraId) {
      addChangedPropToTransaction(view, "cameraId")
    }
    view.cameraId = cameraId
  }

  @ReactProp(name = "photo")
  fun setPhoto(view: CameraView, photo: Boolean?) {
    if (view.photo != photo) {
      addChangedPropToTransaction(view, "photo")
    }
    view.photo = photo
  }

  @ReactProp(name = "video")
  fun setVideo(view: CameraView, video: Boolean?) {
    if (view.video != video) {
      addChangedPropToTransaction(view, "video")
    }
    view.video = video
  }

  @ReactProp(name = "audio")
  fun setAudio(view: CameraView, audio: Boolean?) {
    if (view.audio != audio) {
      addChangedPropToTransaction(view, "audio")
    }
    view.audio = audio
  }

  @ReactProp(name = "enableFrameProcessor")
  fun setEnableFrameProcessor(view: CameraView, enableFrameProcessor: Boolean) {
    if (view.enableFrameProcessor != enableFrameProcessor) {
      addChangedPropToTransaction(view, "enableFrameProcessor")
    }
    view.enableFrameProcessor = enableFrameProcessor
  }

  @ReactProp(name = "pixelFormat")
  fun setPixelFormat(view: CameraView, pixelFormat: String?) {
    val newPixelFormat = PixelFormat.fromUnionValue(pixelFormat)
    if (view.pixelFormat != newPixelFormat) {
      addChangedPropToTransaction(view, "pixelFormat")
    }
    view.pixelFormat = newPixelFormat ?: PixelFormat.NATIVE
  }

  @ReactProp(name = "enableDepthData")
  fun setEnableDepthData(view: CameraView, enableDepthData: Boolean) {
    if (view.enableDepthData != enableDepthData) {
      addChangedPropToTransaction(view, "enableDepthData")
    }
    view.enableDepthData = enableDepthData
  }

  @ReactProp(name = "enableZoomGesture")
  fun setEnableZoomGesture(view: CameraView, enableZoomGesture: Boolean) {
    if (view.enableZoomGesture != enableZoomGesture) {
      addChangedPropToTransaction(view, "enableZoomGesture")
    }
    view.enableZoomGesture = enableZoomGesture
  }

  @ReactProp(name = "videoStabilizationMode")
  fun setVideoStabilizationMode(view: CameraView, videoStabilizationMode: String?) {
    val newMode = VideoStabilizationMode.fromUnionValue(videoStabilizationMode)
    if (view.videoStabilizationMode != newMode) {
      addChangedPropToTransaction(view, "videoStabilizationMode")
    }
    view.videoStabilizationMode = newMode
  }

  @ReactProp(name = "enableHighQualityPhotos")
  fun setEnableHighQualityPhotos(view: CameraView, enableHighQualityPhotos: Boolean?) {
    if (view.enableHighQualityPhotos != enableHighQualityPhotos) {
      addChangedPropToTransaction(view, "enableHighQualityPhotos")
    }
    view.enableHighQualityPhotos = enableHighQualityPhotos
  }

  @ReactProp(name = "enablePortraitEffectsMatteDelivery")
  fun setEnablePortraitEffectsMatteDelivery(view: CameraView, enablePortraitEffectsMatteDelivery: Boolean) {
    if (view.enablePortraitEffectsMatteDelivery != enablePortraitEffectsMatteDelivery) {
      addChangedPropToTransaction(view, "enablePortraitEffectsMatteDelivery")
    }
    view.enablePortraitEffectsMatteDelivery = enablePortraitEffectsMatteDelivery
  }

  @ReactProp(name = "format")
  fun setFormat(view: CameraView, format: ReadableMap?) {
    if (view.format != format) {
      addChangedPropToTransaction(view, "format")
    }
    view.format = format
  }

  @ReactProp(name = "resizeMode")
  fun setResizeMode(view: CameraView, resizeMode: String) {
    val newMode = ResizeMode.fromUnionValue(resizeMode)
    if (view.resizeMode != newMode) {
      addChangedPropToTransaction(view, "resizeMode")
    }
    view.resizeMode = newMode
  }

  // TODO: Change when TurboModules release.
  // We're treating -1 as "null" here, because when I make the fps parameter
  // of type "Int?" the react bridge throws an error.
  @ReactProp(name = "fps", defaultInt = -1)
  fun setFps(view: CameraView, fps: Int) {
    if (view.fps != fps) {
      addChangedPropToTransaction(view, "fps")
    }
    view.fps = if (fps > 0) fps else null
  }

  @ReactProp(name = "hdr")
  fun setHdr(view: CameraView, hdr: Boolean?) {
    if (view.hdr != hdr) {
      addChangedPropToTransaction(view, "hdr")
    }
    view.hdr = hdr
  }

  @ReactProp(name = "lowLightBoost")
  fun setLowLightBoost(view: CameraView, lowLightBoost: Boolean?) {
    if (view.lowLightBoost != lowLightBoost) {
      addChangedPropToTransaction(view, "lowLightBoost")
    }
    view.lowLightBoost = lowLightBoost
  }

  @ReactProp(name = "isActive")
  fun setIsActive(view: CameraView, isActive: Boolean) {
    if (view.isActive != isActive) {
      addChangedPropToTransaction(view, "isActive")
    }
    view.isActive = isActive
  }

  @ReactProp(name = "torch")
  fun setTorch(view: CameraView, torch: String) {
    val newMode = Torch.fromUnionValue(torch)
    if (view.torch != newMode) {
      addChangedPropToTransaction(view, "torch")
    }
    view.torch = newMode
  }

  @ReactProp(name = "zoom")
  fun setZoom(view: CameraView, zoom: Double) {
    val zoomFloat = zoom.toFloat()
    if (view.zoom != zoomFloat) {
      addChangedPropToTransaction(view, "zoom")
    }
    view.zoom = zoomFloat
  }

  @ReactProp(name = "orientation")
  fun setOrientation(view: CameraView, orientation: String?) {
    val newMode = Orientation.fromUnionValue(orientation)
    if (view.orientation != newMode) {
      addChangedPropToTransaction(view, "orientation")
    }
    view.orientation = newMode
  }

  companion object {
    const val TAG = "CameraView"

    val cameraViewTransactions: HashMap<CameraView, ArrayList<String>> = HashMap()

    private fun addChangedPropToTransaction(view: CameraView, changedProp: String) {
      if (cameraViewTransactions[view] == null) {
        cameraViewTransactions[view] = ArrayList()
      }
      cameraViewTransactions[view]!!.add(changedProp)
    }
  }
}
