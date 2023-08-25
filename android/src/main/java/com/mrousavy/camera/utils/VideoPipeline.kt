package com.mrousavy.camera.utils

import com.facebook.jni.HybridData

@Suppress("KotlinJniMissingFunction")
class VideoPipeline {
  private val mHybridData: HybridData

  init {
    mHybridData = initHybrid()
  }


  private external fun initHybrid(): HybridData
}
