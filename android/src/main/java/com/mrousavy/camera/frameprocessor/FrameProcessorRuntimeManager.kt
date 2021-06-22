package com.mrousavy.camera.frameprocessor

import android.util.Log
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl
import com.mrousavy.camera.CameraView
import com.mrousavy.camera.ViewNotFoundError
import com.swmansion.reanimated.Scheduler
import java.lang.ref.WeakReference

class FrameProcessorRuntimeManager(context: ReactApplicationContext) {
  companion object {
    const val TAG = "FrameProcessorRuntime"

    init {
      System.loadLibrary("reanimated")
      System.loadLibrary("VisionCamera")
    }
  }

  @DoNotStrip
  private var mHybridData: HybridData?
  private var mContext: WeakReference<ReactApplicationContext>?
  private var mScheduler: Scheduler?

  init {
    val holder = context.catalystInstance.jsCallInvokerHolder as CallInvokerHolderImpl
    mScheduler = Scheduler(context)
    mContext = WeakReference(context)
    mHybridData = initHybrid(context.javaScriptContextHolder.get(), holder, mScheduler!!)
    initializeRuntime()
  }

  fun destroy() {
    mScheduler?.deactivate()
    mHybridData?.resetNative()
  }

  fun findCameraViewById(viewId: Int): CameraView {
    Log.d(TAG, "finding view $viewId...")
    val view = mContext?.get()?.currentActivity?.findViewById<CameraView>(viewId)
    Log.d(TAG, "found view $viewId! is null: ${view == null}")
    return view ?: throw ViewNotFoundError(viewId)
  }

  private external fun initHybrid(
    jsContext: Long,
    jsCallInvokerHolder: CallInvokerHolderImpl,
    scheduler: Scheduler
  ): HybridData?
  external fun installJSIBindings()
  private external fun initializeRuntime()
}
