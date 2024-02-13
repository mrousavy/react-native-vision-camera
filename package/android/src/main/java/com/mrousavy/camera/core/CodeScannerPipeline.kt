package com.mrousavy.camera.core

import android.media.ImageReader
import android.util.Size
import android.view.Surface
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import com.mrousavy.camera.types.Orientation
import java.io.Closeable

class CodeScannerPipeline(
  val size: Size,
  val format: Int,
  val configuration: CameraConfiguration.CodeScanner,
  val callback: CameraSession.Callback
) : Closeable {
  companion object {
    // We want to have a buffer of 2 images, but we always only acquire one.
    // That way the pipeline is free to stream one frame into the unused buffer,
    // while the other buffer is being used for code scanning.
    private const val MAX_IMAGES = 2
  }

  private val imageReader: ImageReader
  private val scanner: BarcodeScanner

  val surface: Surface
    get() = imageReader.surface

  init {
    val types = configuration.codeTypes.map { it.toBarcodeType() }
    val barcodeScannerOptions = BarcodeScannerOptions.Builder()
      .setBarcodeFormats(types[0], *types.toIntArray())
      .build()
    scanner = BarcodeScanning.getClient(barcodeScannerOptions)

    var isBusy = false
    imageReader = ImageReader.newInstance(size.width, size.height, format, MAX_IMAGES)
    imageReader.setOnImageAvailableListener({ reader ->
      val image = reader.acquireLatestImage() ?: return@setOnImageAvailableListener

      if (isBusy) {
        // We're currently executing on a previous Frame, so we skip this one.
        // Close it and free it again, so that the Camera does not stall.
        image.close()
        return@setOnImageAvailableListener
      }

      isBusy = true
      // TODO: Get correct orientation
      val inputImage = InputImage.fromMediaImage(image, Orientation.PORTRAIT.toDegrees())
      scanner.process(inputImage)
        .addOnSuccessListener { barcodes ->
          if (barcodes.isNotEmpty()) {
            callback.onCodeScanned(barcodes, CodeScannerFrame(inputImage.width, inputImage.height))
          }
        }
        .addOnFailureListener { error ->
          callback.onError(error)
        }
        .addOnCompleteListener {
          image.close()
          isBusy = false
        }
    }, CameraQueues.videoQueue.handler)
  }

  override fun close() {
    imageReader.close()
    scanner.close()
  }

  override fun toString(): String {
    val codeTypes = configuration.codeTypes.joinToString(", ")
    return "${size.width} x ${size.height} CodeScanner for [$codeTypes] ($format)"
  }
}
