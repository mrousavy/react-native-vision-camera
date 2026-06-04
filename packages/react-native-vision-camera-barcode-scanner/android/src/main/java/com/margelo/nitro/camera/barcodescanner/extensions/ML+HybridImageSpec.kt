package com.margelo.nitro.camera.barcodescanner.extensions

import com.google.mlkit.vision.common.InputImage
import com.margelo.nitro.image.HybridImage
import com.margelo.nitro.image.HybridImageSpec
import com.margelo.nitro.image.extensions.toCpuAccessible

fun HybridImageSpec.toInputImage(): InputImage {
  val image =
    this as? HybridImage
      ?: throw Error("Image is not of type `HybridImage`!")

  val bitmap = image.bitmap.toCpuAccessible()
  return InputImage.fromBitmap(bitmap, 0)
}
