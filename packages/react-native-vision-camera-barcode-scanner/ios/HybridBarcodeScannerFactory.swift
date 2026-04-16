//
//  HybridBarcodeScannerFactory.swift
//  VisionCameraBarcodeScanner
//
//  Created by Marc Rousavy on 08.02.26.
//

import NitroModules
import VisionCamera

class HybridBarcodeScannerFactory: HybridBarcodeScannerFactorySpec {
  func createBarcodeScanner(options: BarcodeScannerOptions) throws -> any HybridBarcodeScannerSpec {
    return HybridBarcodeScanner(options: options)
  }

  func createBarcodeScannerOutput(options: BarcodeScannerOutputOptions) throws
    -> any HybridCameraOutputSpec
  {
    return HybridBarcodeScannerOutput(options: options)
  }
}
