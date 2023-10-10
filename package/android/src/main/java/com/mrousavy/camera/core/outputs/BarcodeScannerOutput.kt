package com.mrousavy.camera.core.outputs

import android.util.Log
import com.mrousavy.camera.core.CodeScannerPipeline
import java.io.Closeable

class BarcodeScannerOutput(private val codeScannerPipeline: CodeScannerPipeline) :
  SurfaceOutput(codeScannerPipeline.surface, codeScannerPipeline.size, OutputType.VIDEO),
  Closeable {
  override fun close() {
    Log.i(TAG, "Closing BarcodeScanner..")
    codeScannerPipeline.close()
    super.close()
  }

  override fun toString(): String = "$outputType ($codeScannerPipeline)"
}
