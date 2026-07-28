package com.margelo.nitro.camera.barcodescanner

import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import com.google.android.gms.tasks.Task
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import com.margelo.nitro.camera.HybridFrameSpec
import com.margelo.nitro.camera.barcodescanner.extensions.toInputImage
import com.margelo.nitro.camera.barcodescanner.extensions.toMLBarcodeScannerOptions
import com.margelo.nitro.core.Promise
import com.margelo.nitro.image.HybridImageSpec
import java.util.concurrent.CancellationException

class HybridBarcodeScanner(
  options: BarcodeScannerOptions,
) : HybridBarcodeScannerSpec() {
  private val scanner = BarcodeScanning.getClient(options.toMLBarcodeScannerOptions())

  @OptIn(ExperimentalGetImage::class)
  override fun scanCodes(frame: HybridFrameSpec): Array<HybridBarcodeSpec> {
    val inputImage = frame.toInputImage()
    val task = scanner.process(inputImage)
    val barcodes = awaitUninterruptibly(task)
    return barcodes
      .map { HybridBarcode(it) }
      .toTypedArray<HybridBarcodeSpec>()
  }

  override fun scanCodesAsync(frame: HybridFrameSpec): Promise<Array<HybridBarcodeSpec>> {
    val inputImage = frame.toInputImage()
    return process(inputImage)
  }

  override fun scanCodesInImageAsync(image: HybridImageSpec): Promise<Array<HybridBarcodeSpec>> {
    val inputImage = image.toInputImage()
    return process(inputImage)
  }

  private fun process(inputImage: InputImage): Promise<Array<HybridBarcodeSpec>> {
    val promise = Promise<Array<HybridBarcodeSpec>>()

    scanner
      .process(inputImage)
      .addOnSuccessListener { barcodes ->
        val hybridBarcodes =
          try {
            barcodes
              .map { HybridBarcode(it) }
              .toTypedArray<HybridBarcodeSpec>()
          } catch (error: Throwable) {
            promise.reject(error)
            return@addOnSuccessListener
          }
        promise.resolve(hybridBarcodes)
      }.addOnFailureListener { error ->
        promise.reject(error)
      }.addOnCanceledListener {
        promise.reject(CancellationException("Barcode scan was cancelled."))
      }

    return promise
  }

  override fun dispose() {
    super.dispose()
    scanner.close()
  }

  /**
   * ML Kit still owns the Frame-backed InputImage while its Task is running.
   * Finish that Task before returning, but preserve interruption for callers.
   */
  private fun <T> awaitUninterruptibly(task: Task<T>): T {
    var wasInterrupted = false
    try {
      while (true) {
        try {
          return Tasks.await(task)
        } catch (_: InterruptedException) {
          wasInterrupted = true
        }
      }
    } finally {
      if (wasInterrupted) {
        Thread.currentThread().interrupt()
      }
    }
  }
}
