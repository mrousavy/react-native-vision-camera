package com.margelo.nitro.camera.barcodescanner.extensions

import android.graphics.PixelFormat
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

  val rotationDegrees = frame.image.imageInfo.rotationDegrees
  return if (frame.image.format == PixelFormat.RGBA_8888) {
    // ML Kit cannot wrap an RGBA android.media.Image directly.
    val bitmap = frame.image.toBitmap()
    InputImage.fromBitmap(bitmap, rotationDegrees)
  } else {
    // Keep compatible formats such as YUV_420_888 on the zero-copy path.
    val mediaImage =
      frame.image.image
        ?: throw Error("Frame does not have an underlying `Image`!")
    InputImage.fromMediaImage(mediaImage, rotationDegrees)
  }
}
