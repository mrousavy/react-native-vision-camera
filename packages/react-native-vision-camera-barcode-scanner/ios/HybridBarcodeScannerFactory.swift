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
#if canImport(MLKitBarcodeScanning)
    return HybridBarcodeScanner(options: options)
#else
    throw RuntimeError.error(withMessage:
      "BarcodeScanner is not available in this build because MLKit was excluded " +
      "(VISION_CAMERA_DISABLE_MLKIT=1 was set at `pod install` time). " +
      "Run on a real device, or rebuild without VISION_CAMERA_DISABLE_MLKIT.")
#endif
  }

  func createBarcodeScannerOutput(options: BarcodeScannerOutputOptions) throws
    -> any HybridCameraOutputSpec
  {
#if canImport(MLKitBarcodeScanning)
    return HybridBarcodeScannerOutput(options: options)
#else
    throw RuntimeError.error(withMessage:
      "BarcodeScannerOutput is not available in this build because MLKit was excluded " +
      "(VISION_CAMERA_DISABLE_MLKIT=1 was set at `pod install` time). " +
      "Run on a real device, or rebuild without VISION_CAMERA_DISABLE_MLKIT.")
#endif
  }
}
