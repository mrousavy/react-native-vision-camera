package com.mrousavy.camera.frameprocessor

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl
import com.swmansion.reanimated.Scheduler
import java.lang.ref.WeakReference

class FrameProcessorRuntimeManager(context: ReactApplicationContext) {
  companion object {
    const val TAG = "FrameProcessorRuntimeManager"

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
    mHybridData = initHybrid(context.javaScriptContextHolder.get(), holder, mScheduler!!)
    mContext = WeakReference(context)
  }

  fun destroy() {
    mScheduler?.deactivate()
    mHybridData?.resetNative()
  }

  private external fun initHybrid(
    jsContext: Long,
    jsCallInvokerHolder: CallInvokerHolderImpl,
    scheduler: Scheduler
  ): HybridData?
  external fun installJSIBindings()
  private external fun initializeRuntime()
}
