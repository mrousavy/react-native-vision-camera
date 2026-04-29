package com.margelo.nitro.camera

import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.camera.extensions.toBitmap
import com.margelo.nitro.camera.public.NativeFrame
import com.margelo.nitro.core.Promise
import com.margelo.nitro.image.HybridImage
import com.margelo.nitro.image.HybridImageSpec

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
