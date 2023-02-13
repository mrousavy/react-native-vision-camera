package com.mrousavy.camera.frameprocessor

import android.util.Log
import androidx.annotation.Keep
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl
import com.facebook.react.uimanager.UIManagerHelper
import com.mrousavy.camera.CameraView
import com.mrousavy.camera.ViewNotFoundError
import java.lang.ref.WeakReference
import java.util.concurrent.ExecutorService

@Suppress("KotlinJniMissingFunction") // I use fbjni, Android Studio is not smart enough to realize that.
class FrameProcessorRuntimeManager(context: ReactApplicationContext, frameProcessorThread: ExecutorService) {
  companion object {
    const val TAG = "FrameProcessorRuntime"
    private val Plugins: ArrayList<FrameProcessorPlugin> = ArrayList()

    init {
      try {
        System.loadLibrary("VisionCamera")
      } catch (e: UnsatisfiedLinkError) {
        Log.e(TAG, "Failed to load VisionCamera C++ library!", e)
        throw e
      }
    }

    fun addPlugin(plugin: FrameProcessorPlugin) {
      Plugins.add(plugin)
    }
  }

  @DoNotStrip
  private var mHybridData: HybridData? = null
  private var mContext: WeakReference<ReactApplicationContext>? = null
  private var mScheduler: VisionCameraScheduler? = null

  init {
    val jsCallInvokerHolder = context.catalystInstance.jsCallInvokerHolder as CallInvokerHolderImpl
    val jsRuntimeHolder = context.javaScriptContextHolder.get()
    mScheduler = VisionCameraScheduler(frameProcessorThread)
    mContext = WeakReference(context)
    mHybridData = initHybrid(jsRuntimeHolder, jsCallInvokerHolder, mScheduler!!)
  }

  @Suppress("unused")
  @DoNotStrip
  @Keep
  fun findCameraViewById(viewId: Int): CameraView {
    Log.d(TAG, "Finding view $viewId...")
    val ctx = mContext?.get()
    val view = if (ctx != null) UIManagerHelper.getUIManager(ctx, viewId)?.resolveView(viewId) as CameraView? else null
    Log.d(TAG,  if (view != null) "Found view $viewId!" else "Couldn't find view $viewId!")
    return view ?: throw ViewNotFoundError(viewId)
  }

  fun installBindings() {
    Log.i(TAG, "Installing JSI Bindings on JS Thread...")
    installJSIBindings()
    Log.i(TAG, "Installing Frame Processor Plugins...")
    Plugins.forEach { plugin ->
      registerPlugin(plugin)
    }
    Log.i(TAG, "Successfully installed ${Plugins.count()} Frame Processor Plugins!")
  }

  // private C++ funcs
  private external fun initHybrid(
    jsContext: Long,
    jsCallInvokerHolder: CallInvokerHolderImpl,
    scheduler: VisionCameraScheduler
  ): HybridData
  private external fun registerPlugin(plugin: FrameProcessorPlugin)
  private external fun installJSIBindings()
}
