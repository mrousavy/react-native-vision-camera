package com.margelo.nitro.camera.barcodescanner

import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.margelo.nitro.camera.HybridFrameSpec
import com.margelo.nitro.camera.barcodescanner.extensions.getBarcodeCoordinateSystemConverter
import com.margelo.nitro.camera.barcodescanner.extensions.toInputImage
import com.margelo.nitro.camera.barcodescanner.extensions.toMLBarcodeScannerOptions
import com.margelo.nitro.core.Promise

class HybridBarcodeScanner(
  options: BarcodeScannerOptions,
) : HybridBarcodeScannerSpec() {
  private val scanner = BarcodeScanning.getClient(options.toMLBarcodeScannerOptions())

  @OptIn(ExperimentalGetImage::class)
  override fun scanCodes(frame: HybridFrameSpec): Array<HybridBarcodeSpec> {
    val image = frame.toInputImage()
    val coordinateConverter = frame.getBarcodeCoordinateSystemConverter()
    val task = scanner.process(image)
    val barcodes = Tasks.await(task)
    return barcodes
      .map { HybridBarcode(it, coordinateConverter) }
      .toTypedArray()
  }

  override fun scanCodesAsync(frame: HybridFrameSpec): Promise<Array<HybridBarcodeSpec>> {
    val promise = Promise<Array<HybridBarcodeSpec>>()

    val image = frame.toInputImage()
    val coordinateConverter = frame.getBarcodeCoordinateSystemConverter()
    scanner
      .process(image)
      .addOnSuccessListener { barcodes ->
        val hybridBarcodes =
          barcodes
            .map { HybridBarcode(it, coordinateConverter) }
            .toTypedArray<HybridBarcodeSpec>()
        promise.resolve(hybridBarcodes)
      }.addOnFailureListener { error ->
        promise.reject(error)
      }

    return promise
  }
}
