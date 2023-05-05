package com.mrousavy.camera

import android.Manifest

class CameraView(context: Context, private val frameProcessorThread: ExecutorService) : FrameLayout(context) {
  companion object {
    const val TAG = "CameraView"
  }

  init {
    mHybridData = initHybrid()
  }
}
