package com.mrousavy.camera.core.outputs

import android.media.ImageReader
import android.util.Log
import android.util.Size
import java.io.Closeable

open class PhotoOutput(private val imageReader: ImageReader, enableHdr: Boolean = false) :
  SurfaceOutput(
    imageReader.surface,
    Size(imageReader.width, imageReader.height),
    OutputType.PHOTO,
    enableHdr
  ),
  Closeable {
  override fun close() {
    Log.i(TAG, "Closing ${imageReader.width}x${imageReader.height} $outputType ImageReader..")
    imageReader.close()
    super.close()
  }

  override fun toString(): String = "$outputType (${imageReader.width} x ${imageReader.height} in format #${imageReader.imageFormat})"
}
