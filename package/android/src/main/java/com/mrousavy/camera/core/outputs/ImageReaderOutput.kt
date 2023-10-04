package com.mrousavy.camera.core.outputs

import android.media.ImageReader
import android.util.Log
import android.util.Size
import java.io.Closeable

open class ImageReaderOutput(private val imageReader: ImageReader, outputType: OutputType, dynamicRangeProfile: Long? = null) :
  SurfaceOutput(
    imageReader.surface,
    Size(imageReader.width, imageReader.height),
    outputType,
    dynamicRangeProfile
  ),
  Closeable {
  override fun close() {
    Log.i(TAG, "Closing ${imageReader.width}x${imageReader.height} $outputType ImageReader..")
    imageReader.close()
    super.close()
  }

  override fun toString(): String = "$outputType (${imageReader.width} x ${imageReader.height} in format #${imageReader.imageFormat})"
}
