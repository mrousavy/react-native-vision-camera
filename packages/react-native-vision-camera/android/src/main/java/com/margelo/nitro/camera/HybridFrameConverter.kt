package com.margelo.nitro.camera

import android.graphics.Bitmap
import android.graphics.Matrix
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.camera.extensions.degrees
import com.margelo.nitro.camera.extensions.toBitmap
import com.margelo.nitro.camera.extensions.toRgbaImageProxy
import com.margelo.nitro.camera.hybrids.instances.HybridFrame
import com.margelo.nitro.camera.public.NativeFrame
import com.margelo.nitro.core.Promise
import com.margelo.nitro.image.HybridImage
import com.margelo.nitro.image.HybridImageSpec
import com.margelo.nitro.image.extensions.toCpuAccessible

@Keep
@DoNotStrip
class HybridFrameConverter : HybridFrameConverterSpec() {
  override fun convertFrameToImage(frame: HybridFrameSpec): HybridImageSpec {
    val nativeFrame =
      frame as? NativeFrame
        ?: throw Error("The given `Frame` is not of type `NativeFrame`!")
    val bitmap = nativeFrame.image.toBitmap(frame.orientation, frame.isMirrored)
    return HybridImage(bitmap)
  }

  override fun convertFrameToImageAsync(frame: HybridFrameSpec): Promise<HybridImageSpec> {
    return Promise.async {
      return@async convertFrameToImage(frame)
    }
  }

  override fun convertImageToFrame(
    image: HybridImageSpec,
    orientation: CameraOrientation,
    isMirrored: Boolean,
  ): HybridFrameSpec {
    val hybridImage =
      image as? HybridImage
        ?: throw Error("The given `Image` is not of type `HybridImage`!")
    val original = hybridImage.bitmap
    // The bitmap might be GPU-backed (HARDWARE) - copy it to a CPU-accessible one if needed.
    var bitmap = original.toCpuAccessible()

    // Only recycle the intermediate Bitmaps we create - not the Image's own Bitmap.
    fun advanceTo(next: Bitmap) {
      if (next !== bitmap && bitmap !== original) {
        bitmap.recycle()
      }
      bitmap = next
    }

    try {
      // Physically rotate/mirror the pixels so that interpreting the resulting
      // buffer with `orientation` and `isMirrored` yields the upright Image again.
      val matrix =
        Matrix().apply {
          if (orientation != CameraOrientation.UP) {
            postRotate(-orientation.degrees.toFloat())
          }
          if (isMirrored) {
            postScale(-1f, 1f)
          }
        }
      if (!matrix.isIdentity) {
        advanceTo(Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, false))
      }

      val imageProxy = bitmap.toRgbaImageProxy(orientation.degrees)
      return HybridFrame(imageProxy, orientation, isMirrored)
    } finally {
      if (bitmap !== original) {
        bitmap.recycle()
      }
    }
  }

  override fun convertImageToFrameAsync(
    image: HybridImageSpec,
    orientation: CameraOrientation,
    isMirrored: Boolean,
  ): Promise<HybridFrameSpec> {
    return Promise.async {
      return@async convertImageToFrame(image, orientation, isMirrored)
    }
  }

  override fun convertDepthToImage(depth: HybridDepthSpec): HybridImageSpec {
    val nativeFrame =
      depth as? NativeFrame
        ?: throw Error("The given `Depth` is not of type `NativeFrame`!")
    val bitmap = nativeFrame.image.toBitmap(depth.orientation, depth.isMirrored)
    return HybridImage(bitmap)
  }

  override fun convertDepthToImageAsync(depth: HybridDepthSpec): Promise<HybridImageSpec> {
    return Promise.async {
      return@async convertDepthToImage(depth)
    }
  }
}
