//
//  HybridBarcodeScanner.swift
//  VisionCameraBarcodeScanner
//
//  Created by Marc Rousavy on 08.02.26.
//

import MLKitBarcodeScanning
import MLKitVision
import NitroImage
import NitroModules
import VisionCamera

class HybridBarcodeScanner: HybridBarcodeScannerSpec {
  private let scanner: BarcodeScanner

  init(options: BarcodeScannerOptions) {
    self.scanner = BarcodeScanner.barcodeScanner(options: options.toMLKitOptions())
    super.init()
  }

  func scanCodes(frame: any HybridFrameSpec) throws -> [any HybridBarcodeSpec] {
    let mlImage = try frame.toMLImage()
    let pointTransform = Self.getBufferToFrameTransform(for: frame)
    let barcodes = try scanner.results(in: mlImage)
    return barcodes.map { HybridBarcode(barcode: $0, pointTransform: pointTransform) }
  }

  func scanCodesAsync(frame: any HybridFrameSpec) throws -> Promise<[any HybridBarcodeSpec]> {
    let mlImage = try frame.toMLImage()
    let pointTransform = Self.getBufferToFrameTransform(for: frame)
    return process(mlImage, pointTransform: pointTransform)
  }

  func scanCodesInImageAsync(image: any HybridImageSpec) throws -> Promise<[any HybridBarcodeSpec]> {
    let mlImage = try image.toMLImage()
    return process(mlImage)
  }

  /**
   * MLKit on iOS returns coordinates in the raw pixel-buffer's coordinate
   * space - `MLImage.orientation` is only a detection hint. VisionCamera's
   * Frame coordinates are in oriented (display) space, so rotate/mirror the
   * MLKit results to match.
   */
  private static func getBufferToFrameTransform(for frame: any HybridFrameSpec)
    -> CGAffineTransform
  {
    let bufferWidth = frame.width
    let bufferHeight = frame.height

    // 1. Rotate buffer coordinates into upright (oriented) coordinates.
    //    `orientation` means: upright = buffer rotated counter-clockwise by
    //    `orientation.degrees`.
    var transform: CGAffineTransform
    let orientedWidth: Double
    switch frame.orientation {
    case .up:
      transform = .identity
      orientedWidth = bufferWidth
    case .left:
      // (x, y) -> (height - y, x)
      transform = CGAffineTransform(a: 0, b: 1, c: -1, d: 0, tx: bufferHeight, ty: 0)
      orientedWidth = bufferHeight
    case .right:
      // (x, y) -> (y, width - x)
      transform = CGAffineTransform(a: 0, b: -1, c: 1, d: 0, tx: 0, ty: bufferWidth)
      orientedWidth = bufferHeight
    case .down:
      // (x, y) -> (width - x, height - y)
      transform = CGAffineTransform(a: -1, b: 0, c: 0, d: -1, tx: bufferWidth, ty: bufferHeight)
      orientedWidth = bufferWidth
    }

    // 2. Mirror the upright image by flipping its x-axis.
    if frame.isMirrored {
      let mirror = CGAffineTransform(a: -1, b: 0, c: 0, d: 1, tx: orientedWidth, ty: 0)
      transform = transform.concatenating(mirror)
    }

    return transform
  }

  private func process(
    _ image: MLImage,
    pointTransform: CGAffineTransform = .identity
  ) -> Promise<[any HybridBarcodeSpec]> {
    let promise = Promise<[any HybridBarcodeSpec]>()

    scanner.process(image) { barcodes, error in
      if let error {
        promise.reject(withError: error)
        return
      }
      if let barcodes {
        promise.resolve(
          withResult: barcodes.map { HybridBarcode(barcode: $0, pointTransform: pointTransform) })
      } else {
        promise.resolve(withResult: [])
      }
    }

    return promise
  }
}
