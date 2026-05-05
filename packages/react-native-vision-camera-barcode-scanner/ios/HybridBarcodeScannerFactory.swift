//
//  HybridBarcodeScannerFactory.swift
//  VisionCameraBarcodeScanner
//
//  Created by Marc Rousavy on 08.02.26.
//

import NitroModules
import VisionCamera

enum SimulatorUnsupported {
  static let message =
    "VisionCameraBarcodeScanner is unavailable on the iOS Simulator because Google MLKit does not ship an arm64-simulator slice. Run on a physical device."
}

class HybridBarcodeScannerFactory: HybridBarcodeScannerFactorySpec {
  func createBarcodeScanner(options: BarcodeScannerOptions) throws -> any HybridBarcodeScannerSpec {
    return HybridBarcodeScanner(options: options)
  }

  func createBarcodeScannerOutput(options: BarcodeScannerOutputOptions) throws
    -> any HybridCameraOutputSpec
  {
    #if targetEnvironment(simulator)
    options.onError(RuntimeError.error(withMessage: SimulatorUnsupported.message))
    #endif
    return HybridBarcodeScannerOutput(options: options)
  }
}
