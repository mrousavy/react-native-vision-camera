package com.margelo.nitro.camera.barcodescanner.extensions

import android.graphics.ImageFormat
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
  val rotationDegrees = frame.image.imageInfo.rotationDegrees
  if (mediaImage.format == ImageFormat.YUV_420_888) {
    return InputImage.fromMediaImage(mediaImage, rotationDegrees)
  }

  // MLKit only supports YUV media Images - for other formats (e.g. RGBA
  // Frames), convert the raw buffer to a Bitmap. `toBitmap()` does not
  // rotate, so the rotation still has to be passed alongside.
  val bitmap = frame.image.toBitmap()
  return InputImage.fromBitmap(bitmap, rotationDegrees)
}
