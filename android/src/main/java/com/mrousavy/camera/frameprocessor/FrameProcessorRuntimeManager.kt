package com.mrousavy.camera.frameprocessor

import android.util.Log
import androidx.annotation.Keep
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl
import com.mrousavy.camera.CameraView
import com.mrousavy.camera.ViewNotFoundError
import java.lang.ref.WeakReference
import java.util.concurrent.ExecutorService

@Suppress("KotlinJniMissingFunction") // I use fbjni, Android Studio is not smart enough to realize that.
class FrameProcessorRuntimeManager(context: ReactApplicationContext, frameProcessorThread: ExecutorService) {
  companion object {
    const val TAG = "FrameProcessorRuntime"
    val Plugins: ArrayList<FrameProcessorPlugin> = ArrayList()
    var enableFrameProcessors = true

    init {
      try {
        System.loadLibrary("reanimated")
        System.loadLibrary("VisionCamera")
      } catch (e: UnsatisfiedLinkError) {
        Log.w(TAG, "Failed to load Reanimated/VisionCamera C++ library. Frame Processors are disabled!")
        enableFrameProcessors = false
      }
    }
  }

  @DoNotStrip
  private var mHybridData: HybridData? = null
  private var mContext: WeakReference<ReactApplicationContext>? = null
  private var mScheduler: VisionCameraScheduler? = null

  init {
    if (enableFrameProcessors) {
      val holder = context.catalystInstance.jsCallInvokerHolder as CallInvokerHolderImpl
      mScheduler = VisionCameraScheduler(frameProcessorThread)
      mContext = WeakReference(context)
      mHybridData = initHybrid(context.javaScriptContextHolder.get(), holder, mScheduler!!)
      initializeRuntime()

      Log.i(TAG, "Installing Frame Processor Plugins...")
      Plugins.forEach { plugin ->
        registerPlugin(plugin)
      }
      Log.i(TAG, "Successfully installed ${Plugins.count()} Frame Processor Plugins!")

      Log.i(TAG, "Installing JSI Bindings on JS Thread...")
      context.runOnJSQueueThread {
        installJSIBindings()
      }
    }
  }

  @Suppress("unused")
  @DoNotStrip
  @Keep
  fun findCameraViewById(viewId: Int): CameraView {
    Log.d(TAG, "Finding view $viewId...")
    val view = mContext?.get()?.currentActivity?.findViewById<CameraView>(viewId)
    Log.d(TAG,  if (view != null) "Found view $viewId!" else "Couldn't find view $viewId!")
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
  private external fun installJSIBindings()
}
