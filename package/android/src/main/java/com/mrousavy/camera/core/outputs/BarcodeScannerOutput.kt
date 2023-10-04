package com.mrousavy.camera.core.outputs

import android.media.ImageReader
import android.util.Log
import com.google.mlkit.vision.barcode.BarcodeScanner
import java.io.Closeable

class BarcodeScannerOutput(private val imageReader: ImageReader, private val barcodeScanner: BarcodeScanner) :
  ImageReaderOutput(imageReader, OutputType.VIDEO),
  Closeable {
  override fun close() {
    Log.i(TAG, "Closing BarcodeScanner..")
    barcodeScanner.close()
    super.close()
  }

  override fun toString(): String =
    "$outputType (${imageReader.width} x ${imageReader.height} ${barcodeScanner.detectorType} BarcodeScanner)"
}
