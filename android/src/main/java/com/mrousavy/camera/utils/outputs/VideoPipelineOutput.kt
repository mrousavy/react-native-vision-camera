package com.mrousavy.camera.utils.outputs

import android.util.Log
import android.util.Size
import com.mrousavy.camera.utils.VideoPipeline
import java.io.Closeable

/**
 * A [SurfaceOutput] that uses a [VideoPipeline] as it's surface.
 */
class VideoPipelineOutput(val videoPipeline: VideoPipeline,
                          outputType: OutputType,
                          dynamicRangeProfile: Long? = null): Closeable, SurfaceOutput(videoPipeline.surface, Size(videoPipeline.width, videoPipeline.height), outputType, dynamicRangeProfile) {
  override fun close() {
    Log.i(TAG, "Closing ${videoPipeline.width}x${videoPipeline.height} Video Pipeline..")
    videoPipeline.close()
  }

  override fun toString(): String {
    return "$outputType (${videoPipeline.width} x ${videoPipeline.height} in format #${videoPipeline.format})"
  }
}
