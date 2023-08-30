package com.mrousavy.camera.skia

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import java.io.Closeable

@Suppress("KotlinJniMissingFunction")
class SkiaRenderer {
  @DoNotStrip
  private var mHybridData: HybridData

  init {
    mHybridData = initHybrid()
  }

  private external fun initHybrid(): HybridData
}
