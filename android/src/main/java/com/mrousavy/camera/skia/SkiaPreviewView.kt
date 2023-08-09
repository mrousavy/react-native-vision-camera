package com.mrousavy.camera.skia

import android.content.Context
import android.opengl.GLSurfaceView
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip

@Suppress("KotlinJniMissingFunction")
class SkiaPreviewView(context: Context): GLSurfaceView(context) {
  @DoNotStrip
  private var mHybridData: HybridData

  init {
    mHybridData = initHybrid()
  }

  external fun initHybrid(): HybridData
}
