//
//  HybridBarcodeScanner.swift
//  VisionCameraBarcodeScanner
//
//  Created by Marc Rousavy on 08.02.26.
//

import MLKitBarcodeScanning
import MLKitVision
import NitroModules
import VisionCamera

class HybridBarcodeScanner: HybridBarcodeScannerSpec {
  private let scanner: BarcodeScanner

  init(options: BarcodeScannerOptions) {
    self.scanner = BarcodeScanner.barcodeScanner(options: options.toMLKitOptions())
    super.init()
  }

  func scanCodes(frame: any HybridFrameSpec) throws -> [any HybridBarcodeSpec] {
    let image = try frame.toMLImage()
    let barcodes = try scanner.results(in: image)
    return barcodes.map { HybridBarcode(barcode: $0) }
  }

  func scanCodesAsync(frame: any HybridFrameSpec) throws -> Promise<[any HybridBarcodeSpec]> {
    let promise = Promise<[any HybridBarcodeSpec]>()

    let image = try frame.toMLImage()
    scanner.process(image) { barcodes, error in
      if let error {
        promise.reject(withError: error)
      }
      if let barcodes {
        promise.resolve(withResult: barcodes.map { HybridBarcode(barcode: $0) })
      }
    }

    return promise
  }
}
