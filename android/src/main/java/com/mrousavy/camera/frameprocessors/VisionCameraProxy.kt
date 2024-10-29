package com.mrousavy.camera.frameprocessors

import android.util.Log
import androidx.annotation.Keep
import androidx.annotation.UiThread
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl
import com.facebook.react.uimanager.UIManagerHelper
import com.mrousavy.camera.core.ViewNotFoundError
import com.mrousavy.camera.react.CameraView
import java.lang.ref.WeakReference

@OptIn(FrameworkAPI::class)
@Suppress("KotlinJniMissingFunction") // we use fbjni.
class VisionCameraProxy(private val reactContext: ReactApplicationContext) {
  companion object {
    const val TAG = "VisionCameraProxy"
  }

  @DoNotStrip
  @Keep
  private var mHybridData: HybridData
  private var mContext: WeakReference<ReactApplicationContext>
  private var mScheduler: VisionCameraScheduler
  val context: ReactApplicationContext
    get() = reactContext

  init {
    val jsCallInvokerHolder = context.catalystInstance.jsCallInvokerHolder as CallInvokerHolderImpl
    val jsRuntimeHolder =
      context.javaScriptContextHolder?.get() ?: throw Error("JSI Runtime is null! VisionCamera does not yet support bridgeless mode..")
    mScheduler = VisionCameraScheduler()
    mContext = WeakReference(context)
    mHybridData = initHybrid(jsRuntimeHolder, jsCallInvokerHolder, mScheduler)
  }

  @UiThread
  private fun findCameraViewById(viewId: Int): CameraView {
    Log.d(TAG, "Finding view $viewId...")
    val ctx = mContext.get()
    val view = if (ctx != null) UIManagerHelper.getUIManager(ctx, viewId)?.resolveView(viewId) as CameraView? else null
    Log.d(TAG, if (view != null) "Found view $viewId!" else "Couldn't find view $viewId!")
    return view ?: throw ViewNotFoundError(viewId)
  }

  @Suppress("unused")
  @DoNotStrip
  @Keep
  fun setFrameProcessor(viewId: Int, frameProcessor: FrameProcessor) {
    UiThreadUtil.runOnUiThread {
      val view = findCameraViewById(viewId)
      view.frameProcessor = frameProcessor
    }
  }

  @Suppress("unused")
  @DoNotStrip
  @Keep
  fun removeFrameProcessor(viewId: Int) {
    UiThreadUtil.runOnUiThread {
      val view = findCameraViewById(viewId)
      view.frameProcessor = null
    }
  }

  @Suppress("unused")
  @DoNotStrip
  @Keep
  fun initFrameProcessorPlugin(name: String, options: Map<String, Any>): FrameProcessorPlugin? =
    FrameProcessorPluginRegistry.getPlugin(name, this, options)

  // private C++ funcs
  private external fun initHybrid(jsContext: Long, jsCallInvokerHolder: CallInvokerHolderImpl, scheduler: VisionCameraScheduler): HybridData
}
