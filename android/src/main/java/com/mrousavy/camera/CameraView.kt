package com.mrousavy.camera

import android.Manifest
import android.content.Context
import android.widget.FrameLayout
import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.frameprocessor.Frame
import java.util.concurrent.ExecutorService

@Suppress("KotlinJniMissingFunction")
class CameraView(context: Context, private val frameProcessorThread: ExecutorService) : FrameLayout(context) {
  companion object {
    const val TAG = "CameraView"
  }

  // region REACT PROPS
  var cameraId: String? = null
  var enableDepthData: Boolean? = null
  var enableHighQualityPhotos: Boolean? = null
  var enablePortraitEffectsMatteDelivery: Boolean? = null
  // TODO: Does Camera2 have presets we can use over the formats?
  // var preset: String? = null

  var photo: Boolean? = null
  var video: Boolean? = null
  var audio: Boolean? = null
  var enableFrameProcessor: Boolean? = null

  var format: ReadableMap? = null
  var fps: Int? = null
  var hdr: Boolean? = null
  var lowLightBoost: Boolean? = null
  var colorSpace: String? = null
  var orientation: String? = null

  var isActive: Boolean? = null
  var torch: String? = null
  var zoom: Float = 1f
  var previewType: String? = null
  var enableZoomGesture: Boolean? = null
  // endregion

  // Internal
  @DoNotStrip
  private var mHybridData: HybridData? = null


  init {
    mHybridData = initHybrid()
  }

  fun update(changedProps: ArrayList<String>) {
    // TODO: Handle prop updates
  }

  // region CAMERA VIEW METHODS
  fun takePhoto(options: ReadableMap) {

  }

  fun takeSnapshot(options: ReadableMap) {

  }

  fun startRecording(options: ReadableMap, callback: Callback) {

  }

  fun stopRecording() {

  }

  fun pauseRecording() {

  }

  fun resumeRecording() {

  }

  fun focus(point: ReadableMap) {

  }

  // endregion

  private external fun initHybrid(): HybridData
  private external fun frameProcessorCallback(frame: Frame)
}
