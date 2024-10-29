package com.mrousavy.camera.core

import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis.Analyzer
import androidx.camera.core.ImageProxy
import com.mrousavy.camera.frameprocessors.Frame

class FrameProcessorPipeline(private val callback: CameraSession.Callback) : Analyzer {
  @OptIn(ExperimentalGetImage::class)
  override fun analyze(imageProxy: ImageProxy) {
    val frame = Frame(imageProxy)
    try {
      frame.incrementRefCount()
      callback.onFrame(frame)
    } finally {
      frame.decrementRefCount()
    }
  }
}
