//
//  CameraSession+CodeScanner.swift
//  VisionCamera
//
//  ML Kit based Code Scanner implementation for iOS
//

import AVFoundation
import Foundation
import MLKitBarcodeScanning
import MLKitVision
import ObjectiveC

extension CameraSession {
  // ML Kit Barcode Scanner instance
  private var mlKitBarcodeScanner: BarcodeScanner? {
    get {
      return objc_getAssociatedObject(self, &AssociatedKeys.mlKitBarcodeScanner) as? BarcodeScanner
    }
    set {
      objc_setAssociatedObject(self, &AssociatedKeys.mlKitBarcodeScanner, newValue, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    }
  }
  
  // Last processed frame timestamp to throttle processing
  private var lastCodeScanTimestamp: CFTimeInterval {
    get {
      let value = objc_getAssociatedObject(self, &AssociatedKeys.lastCodeScanTimestamp) as? NSNumber
      return value?.doubleValue ?? 0
    }
    set {
      objc_setAssociatedObject(self, &AssociatedKeys.lastCodeScanTimestamp, NSNumber(value: newValue), .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    }
  }
  
  // Associated Object Keys
  private struct AssociatedKeys {
    static var mlKitBarcodeScanner = "mlKitBarcodeScanner"
    static var lastCodeScanTimestamp = "lastCodeScanTimestamp"
  }
  
  /**
   Configures ML Kit Barcode Scanner
   */
  func configureCodeScannerMLKit(configuration: CameraConfiguration.CodeScanner) {
    VisionLogger.log(level: .info, message: "🔵 ML Kit: Configuring Barcode Scanner...")
    
    let types = configuration.options.codeTypes.map { $0.toMLKitBarcodeFormat() }
    
    let formats: BarcodeFormat
    if types.isEmpty {
      formats = .all
    } else {
      // 最初の要素を初期値として、残りをunionで結合
      formats = types.dropFirst().reduce(types.first ?? .all) { $0.union($1) }
    }
    
    VisionLogger.log(level: .info, message: "🔵 ML Kit: Barcode formats: \(formats)")
    
    let options = BarcodeScannerOptions(formats: formats)
    mlKitBarcodeScanner = BarcodeScanner.barcodeScanner(options: options)
    
    VisionLogger.log(level: .info, message: "🔵 ML Kit: Barcode Scanner initialized successfully!")
  }
  
  /**
   Processes a video frame for barcode detection using ML Kit
   */
  func processFrameForCodeScannerMLKit(sampleBuffer: CMSampleBuffer, orientation: Orientation) {
    guard let scanner = mlKitBarcodeScanner,
          let onCodeScanned = delegate?.onCodeScanned else {
      return
    }
    
    // Throttle processing based on interval (similar to Android implementation)
    let currentTime = CACurrentMediaTime()
    let interval: Int
    if case let .enabled(codeScanner) = configuration?.codeScanner {
      interval = codeScanner.options.interval
    } else {
      interval = 300
    }
    let intervalSeconds = Double(interval) / 1000.0
    
    if currentTime - lastCodeScanTimestamp < intervalSeconds {
      return
    }
    lastCodeScanTimestamp = currentTime
    
    // Create VisionImage from sample buffer
    let image = VisionImage(buffer: sampleBuffer)
    
    // Set orientation
    image.orientation = orientation.toUIImageOrientation()
    
    // Process image
    scanner.process(image) { [weak self] barcodes, error in
      guard let self = self else { return }
      
      if let error = error {
        let nsError = error as NSError
        VisionLogger.log(level: .error, message: "🔴 ML Kit: Error processing barcode: \(error.localizedDescription)")
        self.delegate?.onError(.unknown(message: error.localizedDescription, cause: nsError))
        return
      }
      
      guard let barcodes = barcodes, !barcodes.isEmpty else {
        return
      }
      
      VisionLogger.log(level: .info, message: "🔵 ML Kit: Detected \(barcodes.count) barcode(s)")
      
      guard let device = self.videoDeviceInput?.device else {
        return
      }
      
      let size = device.activeFormat.videoDimensions
      
      // Convert ML Kit barcodes to Code structs
      let codes = barcodes.map { barcode in
        return self.convertMLKitBarcodeToCode(barcode: barcode, imageSize: size)
      }
      
      VisionLogger.log(level: .info, message: "🔵 ML Kit: Converted to \(codes.count) Code(s)")
      
      // Call delegate
      onCodeScanned(codes, CodeScannerFrame(width: size.width, height: size.height))
    }
  }
  
  /**
   Converts ML Kit Barcode to CameraSession.Code
   */
  private func convertMLKitBarcodeToCode(barcode: Barcode, imageSize: CMVideoDimensions) -> Code {
    VisionLogger.log(level: .info, message: "🔵 ML Kit: BarcodeFormat = \(barcode.format), rawValue = \(barcode.format.rawValue)")
    
    let type = barcode.format.toAVMetadataObjectType()
    let value = barcode.rawValue
    
    // Convert bounding box to frame
    var frame: CGRect = .zero
    let boundingBox = barcode.frame
    if !boundingBox.isEmpty {
      frame = boundingBox
    }
    
    // Convert corner points
    var corners: [CGPoint]?
    if let cornerPoints = barcode.cornerPoints, !cornerPoints.isEmpty {
      corners = cornerPoints.map { point in
        var cgPoint = CGPoint.zero
        point.getValue(&cgPoint)
        return cgPoint
      }
    } else if frame != .zero {
      // Fallback: calculate corners from bounding box if cornerPoints are not available
      corners = [
        CGPoint(x: frame.origin.x, y: frame.origin.y),                    // Top-left
        CGPoint(x: frame.origin.x + frame.width, y: frame.origin.y),      // Top-right
        CGPoint(x: frame.origin.x + frame.width, y: frame.origin.y + frame.height), // Bottom-right
        CGPoint(x: frame.origin.x, y: frame.origin.y + frame.height)      // Bottom-left
      ]
    }
    
    return Code(type: type, value: value, frame: frame, corners: corners)
  }
  
  /**
   Closes and releases the ML Kit Barcode Scanner
   */
  func closeCodeScannerMLKit() {
    mlKitBarcodeScanner = nil
  }
  
  /**
   A scanned QR/Barcode.
   */
  struct Code {
    /**
     Type of the scanned Code
     */
    let type: AVMetadataObject.ObjectType
    /**
     Decoded value of the code
     */
    let value: String?
    /**
     Location of the code on-screen, relative to the video output layer
     */
    let frame: CGRect
    
    /**
     Location of the code corners on-screen, relative to the video output layer
     */
    let corners: [CGPoint]?
    
    /**
     Converts this Code to a JS Object (Dictionary)
     */
    func toJSValue() -> [String: AnyHashable] {
      var result: [String: AnyHashable] = [
        "type": type.descriptor,
        "frame": [
          "x": frame.origin.x,
          "y": frame.origin.y,
          "width": frame.size.width,
          "height": frame.size.height,
        ],
        "corners": corners?.map { [
          "x": $0.x,
          "y": $0.y,
        ] } ?? [],
      ]
      
      if let value = value {
        result["value"] = value
      } else {
        result["value"] = NSNull()
      }
      
      return result
    }
  }
  
  struct CodeScannerFrame {
    let width: Int32
    let height: Int32
    
    func toJSValue() -> [String: AnyHashable] {
      return [
        "width": width,
        "height": height,
      ]
    }
  }
}

// MARK: - Helper Extensions

extension AVMetadataObject.ObjectType {
  /**
   Converts AVMetadataObject.ObjectType to ML Kit BarcodeFormat
   */
  func toMLKitBarcodeFormat() -> BarcodeFormat {
    switch self {
    case .code128:
      return .code128
    case .code39:
      return .code39
    case .code93:
      return .code93
    case .ean13:
      return .EAN13
    case .ean8:
      return .EAN8
    case .interleaved2of5:
      return .ITF
    case .itf14:
      return .ITF
    case .upce:
      return .UPCE
    case .qr:
      return .qrCode
    case .pdf417:
      return .PDF417
    case .aztec:
      return .aztec
    case .dataMatrix:
      return .dataMatrix
    default:
      if #available(iOS 15.4, *) {
        switch self {
        case .codabar:
          // ML Kit doesn't have codabar, use closest match
          return .all
        case .gs1DataBar, .gs1DataBarLimited, .gs1DataBarExpanded:
          return .dataMatrix
        default:
          return .all
        }
      } else {
        return .all
      }
    }
  }
}

extension BarcodeFormat {
  /**
   Converts ML Kit BarcodeFormat to AVMetadataObject.ObjectType
   */
  func toAVMetadataObjectType() -> AVMetadataObject.ObjectType {
    switch self {
    case .code128:
      return .code128
    case .code39:
      return .code39
    case .code93:
      return .code93
    case .EAN13:
      return .ean13
    case .EAN8:
      return .ean8
    case .ITF:
      return .interleaved2of5
    case .UPCE:
      return .upce
    case .qrCode:
      return .qr
    case .PDF417:
      return .pdf417
    case .aztec:
      return .aztec
    case .dataMatrix:
      return .dataMatrix
    default:
      if #available(iOS 15.4, *) {
        return .codabar
      } else {
        return .qr
      }
    }
  }
}

extension Orientation {
  /**
   Converts Orientation to UIImage.Orientation for ML Kit
   */
  func toUIImageOrientation() -> UIImage.Orientation {
    switch self {
    case .portrait:
      return .up
    case .portraitUpsideDown:
      return .down
    case .landscapeLeft:
      return .left
    case .landscapeRight:
      return .right
    }
  }
}