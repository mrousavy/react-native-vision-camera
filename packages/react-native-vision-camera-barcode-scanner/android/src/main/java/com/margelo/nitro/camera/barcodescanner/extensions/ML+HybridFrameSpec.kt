package com.margelo.nitro.camera.barcodescanner.extensions

import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import com.google.mlkit.vision.common.InputImage
import com.margelo.nitro.camera.HybridFrameSpec
import com.margelo.nitro.camera.PixelFormat
import com.margelo.nitro.camera.public.NativeFrame

@OptIn(ExperimentalGetImage::class)
fun HybridFrameSpec.toInputImage(): InputImage {
  val frame =
    this as? NativeFrame
      ?: throw Error("Frame is not of type `NativeFrame`!")

  val mediaImage =
    frame.image.image
      ?: throw Error("Frame does not have an underlying `Image`!")
  val rotationDegrees = frame.image.imageInfo.rotationDegrees
  return when (pixelFormat) {
    PixelFormat.RGB_BGRA_8_BIT,
    PixelFormat.RGB_RGBA_8_BIT,
    PixelFormat.RGB_RGB_8_BIT,
    -> {
      // Slow path: `InputImage` does not work with RGB `Image`s,
      // so we need to use the `Bitmap` constructor.
      val bitmap = frame.image.toBitmap()
      InputImage.fromBitmap(bitmap, rotationDegrees)
    }
    else -> {
      // Fast path: We can wrap the `Image` as an `InputImage` directly
      // if it's a compatible format (e.g. YUV_420_888)
      InputImage.fromMediaImage(mediaImage, rotationDegrees)
    }
  }
}
