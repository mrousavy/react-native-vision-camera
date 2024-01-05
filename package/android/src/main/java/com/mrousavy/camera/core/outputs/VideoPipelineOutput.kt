package com.mrousavy.camera.core.outputs

import android.util.Log
import android.util.Size
import com.mrousavy.camera.core.VideoPipeline
import java.io.Closeable

class VideoPipelineOutput(val videoPipeline: VideoPipeline, enableHdr: Boolean = false) :
  SurfaceOutput(
    videoPipeline.surface,
    Size(videoPipeline.width, videoPipeline.height),
    OutputType.VIDEO,
    enableHdr
  ),
  Closeable {
  override fun close() {
    Log.i(TAG, "Closing ${videoPipeline.width}x${videoPipeline.height} Video Pipeline..")
    videoPipeline.close()
    super.close()
  }

  override fun toString(): String = "$outputType (${size.width}x${size.height} in ${videoPipeline.format})"
}
