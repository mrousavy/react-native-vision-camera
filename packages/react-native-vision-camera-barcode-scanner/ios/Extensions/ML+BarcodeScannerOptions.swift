//
//  ML+BarcodeScannerOptions.swift
//  VisionCameraBarcodeScanner
//
//  Created by Marc Rousavy on 08.02.26.
//

import MLKitBarcodeScanning

extension BarcodeScannerOptions {
  func toMLKitOptions() -> MLKitBarcodeScanning.BarcodeScannerOptions {
    let formats = self.barcodeFormats.map { $0.toMLKitFormat() }
    let combinedFormats = MLKitBarcodeScanning.BarcodeFormat(formats)
    return MLKitBarcodeScanning.BarcodeScannerOptions(formats: combinedFormats)
  }
}

extension BarcodeScannerOutputOptions {
  func toMLKitOptions() -> MLKitBarcodeScanning.BarcodeScannerOptions {
    let formats = self.barcodeFormats.map { $0.toMLKitFormat() }
    let combinedFormats = MLKitBarcodeScanning.BarcodeFormat(formats)
    return MLKitBarcodeScanning.BarcodeScannerOptions(formats: combinedFormats)
  }
}
