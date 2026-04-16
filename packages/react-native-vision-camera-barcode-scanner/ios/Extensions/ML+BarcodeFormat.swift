//
//  ML+TargetBarcodeFormat.swift
//  VisionCameraBarcodeScanner
//
//  Created by Marc Rousavy on 08.02.26.
//

import MLKitBarcodeScanning

extension BarcodeFormat {
  init(fromMLKitFormat format: MLKitBarcodeScanning.BarcodeFormat) {
    switch format {
    case .code128:
      self = .code128
    case .code39:
      self = .code39
    case .code93:
      self = .code93
    case .codaBar:
      self = .codabar
    case .dataMatrix:
      self = .dataMatrix
    case .EAN13:
      self = .ean13
    case .EAN8:
      self = .ean8
    case .ITF:
      self = .itf
    case .qrCode:
      self = .qrCode
    case .UPCA:
      self = .upcA
    case .UPCE:
      self = .upcE
    case .PDF417:
      self = .pdf417
    case .aztec:
      self = .aztec
    default:
      self = .unknown
    }
  }
}

extension TargetBarcodeFormat {
  func toMLKitFormat() -> MLKitBarcodeScanning.BarcodeFormat {
    switch self {
    case .allFormats:
      return .all
    case .code128:
      return .code128
    case .code39:
      return .code39
    case .code93:
      return .code93
    case .codabar:
      return .codaBar
    case .dataMatrix:
      return .dataMatrix
    case .ean13:
      return .EAN13
    case .ean8:
      return .EAN8
    case .itf:
      return .ITF
    case .qrCode:
      return .qrCode
    case .upcA:
      return .UPCA
    case .upcE:
      return .UPCE
    case .pdf417:
      return .PDF417
    case .aztec:
      return .aztec
    }
  }
}
