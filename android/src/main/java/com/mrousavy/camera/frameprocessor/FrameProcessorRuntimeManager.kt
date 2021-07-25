package com.mrousavy.camera.frameprocessor

import android.util.Log
import androidx.annotation.Keep
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl
import com.mrousavy.camera.CameraView
import com.mrousavy.camera.ViewNotFoundError
import com.swmansion.reanimated.Scheduler
import java.lang.ref.WeakReference

@Suppress("KotlinJniMissingFunction") // I use fbjni, Android Studio is not smart enough to realize that.
class FrameProcessorRuntimeManager(context: ReactApplicationContext) {
  companion object {
    const val TAG = "FrameProcessorRuntime"
    val Plugins: ArrayList<FrameProcessorPlugin> = ArrayList()

    init {
      System.loadLibrary("reanimated")
      System.loadLibrary("VisionCamera")
    }
  }

  @DoNotStrip
  private var mHybridData: HybridData
  private var mContext: WeakReference<ReactApplicationContext>
  private var mScheduler: VisionCameraScheduler

  init {
    val holder = context.catalystInstance.jsCallInvokerHolder as CallInvokerHolderImpl
    mScheduler = VisionCameraScheduler()
    mContext = WeakReference(context)
    mHybridData = initHybrid(context.javaScriptContextHolder.get(), holder, mScheduler)
    initializeRuntime()

    Log.i(TAG, "Installing Frame Processor Plugins...")
    Plugins.forEach { plugin ->
      registerPlugin(plugin)
    }
    Log.i(TAG, "Successfully installed ${Plugins.count()} Frame Processor Plugins!")
  }

  fun destroy() {
    mHybridData.resetNative()
  }

  @DoNotStrip
  @Keep
  fun findCameraViewById(viewId: Int): CameraView {
    Log.d(TAG, "finding view $viewId...")
    val view = mContext.get()?.currentActivity?.findViewById<CameraView>(viewId)
    Log.d(TAG, "found view $viewId! is null: ${view == null}")
    return view ?: throw ViewNotFoundError(viewId)
  }

  // private C++ funcs
  private external fun initHybrid(
    jsContext: Long,
    jsCallInvokerHolder: CallInvokerHolderImpl,
    scheduler: VisionCameraScheduler
  ): HybridData
  private external fun initializeRuntime()
  private external fun registerPlugin(plugin: FrameProcessorPlugin)

  // public C++ funcs
  external fun installJSIBindings()
}
