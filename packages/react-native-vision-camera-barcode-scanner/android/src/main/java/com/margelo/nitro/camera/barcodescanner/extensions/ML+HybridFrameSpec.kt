package com.margelo.nitro.camera.barcodescanner.extensions

import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import com.google.mlkit.vision.common.InputImage
import com.margelo.nitro.camera.HybridFrameSpec
import com.margelo.nitro.camera.public.NativeFrame

@OptIn(ExperimentalGetImage::class)
fun HybridFrameSpec.toInputImage(): InputImage {
  val frame =
    this as? NativeFrame
      ?: throw Error("Frame is not of type `NativeFrame`!")

  val mediaImage =
    frame.image.image
      ?: throw Error("Frame does not have an underlying `Image`!")
  return InputImage.fromMediaImage(mediaImage, frame.image.imageInfo.rotationDegrees)
}
