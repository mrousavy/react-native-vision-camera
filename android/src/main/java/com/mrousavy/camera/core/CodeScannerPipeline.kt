package com.mrousavy.camera.core

import android.util.Log
import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis.Analyzer
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import java.io.Closeable

class CodeScannerPipeline(val configuration: CameraConfiguration.CodeScanner, val callback: CameraSession.Callback) :
  Closeable,
  Analyzer {
  companion object {
    private const val TAG = "CodeScannerPipeline"
  }
  private val scanner: BarcodeScanner

  init {
    val types = configuration.codeTypes.map { it.toBarcodeType() }
    val barcodeScannerOptions = BarcodeScannerOptions.Builder()
      .setBarcodeFormats(types[0], *types.toIntArray())
      .build()
    scanner = BarcodeScanning.getClient(barcodeScannerOptions)
  }

  @OptIn(ExperimentalGetImage::class)
  override fun analyze(imageProxy: ImageProxy) {
    val image = imageProxy.image ?: throw InvalidImageTypeError()

    try {
      val inputImage = InputImage.fromMediaImage(image, imageProxy.imageInfo.rotationDegrees)
      scanner.process(inputImage)
        .addOnSuccessListener { barcodes ->
          if (barcodes.isNotEmpty()) {
            callback.onCodeScanned(barcodes, CodeScannerFrame(inputImage.width, inputImage.height))
          }
        }
        .addOnFailureListener { error ->
          Log.e(TAG, "Failed to process Image!", error)
          callback.onError(error)
        }
        .addOnCompleteListener {
          imageProxy.close()
        }
    } catch (e: Throwable) {
      Log.e(TAG, "Failed to process Image!", e)
      imageProxy.close()
    }
  }

  override fun close() {
    scanner.close()
  }
}
