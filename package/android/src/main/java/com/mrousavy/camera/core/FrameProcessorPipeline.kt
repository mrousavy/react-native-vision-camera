package com.mrousavy.camera.core

import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis.Analyzer
import androidx.camera.core.ImageProxy
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.types.Orientation

class FrameProcessorPipeline(private val callback: CameraSession.Callback) : Analyzer {
  @OptIn(ExperimentalGetImage::class)
  override fun analyze(imageProxy: ImageProxy) {
    val orientation = Orientation.fromRotationDegrees(imageProxy.imageInfo.rotationDegrees)
    // TODO: Get isMirrored from transformation matrix?
    val isMirrored = false
    val frame = Frame(imageProxy.image, imageProxy.imageInfo.timestamp, orientation, isMirrored)
    try {
      frame.incrementRefCount()
      callback.onFrame(frame)
    } finally {
      frame.decrementRefCount()
    }
  }
}
