package com.mrousavy.camera.react

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp
import com.mrousavy.camera.core.types.CameraDeviceFormat
import com.mrousavy.camera.core.types.CodeScannerOptions
import com.mrousavy.camera.core.types.OutputOrientation
import com.mrousavy.camera.core.types.PixelFormat
import com.mrousavy.camera.core.types.PreviewViewType
import com.mrousavy.camera.core.types.QualityBalance
import com.mrousavy.camera.core.types.ResizeMode
import com.mrousavy.camera.core.types.Torch
import com.mrousavy.camera.core.types.VideoStabilizationMode

@Suppress("unused")
class CameraViewManager : ViewGroupManager<CameraView>() {
  companion object {
    const val TAG = "CameraView"
  }
  public override fun createViewInstance(context: ThemedReactContext): CameraView = CameraView(context)

  override fun onAfterUpdateTransaction(view: CameraView) {
    super.onAfterUpdateTransaction(view)
    view.update()
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any>? =
    MapBuilder.builder<String, Any>()
      .put(CameraViewReadyEvent.EVENT_NAME, MapBuilder.of("registrationName", "onViewReady"))
      .put(CameraInitializedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onInitialized"))
      .put(CameraStartedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onStarted"))
      .put(CameraStoppedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onStopped"))
      .put(CameraShutterEvent.EVENT_NAME, MapBuilder.of("registrationName", "onShutter"))
      .put(CameraErrorEvent.EVENT_NAME, MapBuilder.of("registrationName", "onError"))
      .put(CameraCodeScannedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onCodeScanned"))
      .put(CameraPreviewStartedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPreviewStarted"))
      .put(CameraPreviewStoppedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPreviewStopped"))
      .put(CameraOutputOrientationChangedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onOutputOrientationChanged"))
      .put(CameraPreviewOrientationChangedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPreviewOrientationChanged"))
      .put(AverageFpsChangedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onAverageFpsChanged"))
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

  @ReactProp(name = "isMirrored")
  fun setIsMirrored(view: CameraView, isMirrored: Boolean) {
    view.isMirrored = isMirrored
  }

  @ReactProp(name = "preview", defaultBoolean = true)
  fun setPreview(view: CameraView, preview: Boolean) {
    view.preview = preview
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

  @ReactProp(name = "enableLocation")
  fun setEnableLocation(view: CameraView, enableLocation: Boolean) {
    view.enableLocation = enableLocation
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
      view.pixelFormat = PixelFormat.YUV
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

  @ReactProp(name = "androidPreviewViewType")
  fun setAndroidPreviewViewType(view: CameraView, androidPreviewViewType: String?) {
    if (androidPreviewViewType != null) {
      val newMode = PreviewViewType.fromUnionValue(androidPreviewViewType)
      view.androidPreviewViewType = newMode
    } else {
      view.androidPreviewViewType = PreviewViewType.SURFACE_VIEW
    }
  }

  // TODO: Change when TurboModules release.
  // We're treating -1 as "null" here, because when I make the fps parameter
  // of type "Int?" the react bridge throws an error.
  @ReactProp(name = "minFps", defaultInt = -1)
  fun setMinFps(view: CameraView, minFps: Int) {
    view.minFps = if (minFps > 0) minFps else null
  }

  // TODO: Change when TurboModules release.
  // We're treating -1 as "null" here, because when I make the fps parameter
  // of type "Int?" the react bridge throws an error.
  @ReactProp(name = "maxFps", defaultInt = -1)
  fun setMaxFps(view: CameraView, maxFps: Int) {
    view.maxFps = if (maxFps > 0) maxFps else null
  }

  @ReactProp(name = "photoHdr")
  fun setPhotoHdr(view: CameraView, photoHdr: Boolean) {
    view.photoHdr = photoHdr
  }

  @ReactProp(name = "photoQualityBalance")
  fun setPhotoQualityBalance(view: CameraView, photoQualityBalance: String?) {
    if (photoQualityBalance != null) {
      val newMode = QualityBalance.fromUnionValue(photoQualityBalance)
      view.photoQualityBalance = newMode
    } else {
      view.photoQualityBalance = QualityBalance.BALANCED
    }
  }

  @ReactProp(name = "videoHdr")
  fun setVideoHdr(view: CameraView, videoHdr: Boolean) {
    view.videoHdr = videoHdr
  }

  @ReactProp(name = "videoBitRateOverride", defaultDouble = -1.0)
  fun setVideoBitRateOverride(view: CameraView, videoBitRateOverride: Double) {
    if (videoBitRateOverride != -1.0) {
      view.videoBitRateOverride = videoBitRateOverride
    } else {
      view.videoBitRateOverride = null
    }
  }

  @ReactProp(name = "videoBitRateMultiplier", defaultDouble = -1.0)
  fun setVideoBitRateMultiplier(view: CameraView, videoBitRateMultiplier: Double) {
    if (videoBitRateMultiplier != -1.0) {
      view.videoBitRateMultiplier = videoBitRateMultiplier
    } else {
      view.videoBitRateMultiplier = null
    }
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

  @ReactProp(name = "outputOrientation")
  fun setOrientation(view: CameraView, outputOrientation: String?) {
    if (outputOrientation != null) {
      val newMode = OutputOrientation.fromUnionValue(outputOrientation)
      view.outputOrientation = newMode
    } else {
      view.outputOrientation = OutputOrientation.DEVICE
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
}
