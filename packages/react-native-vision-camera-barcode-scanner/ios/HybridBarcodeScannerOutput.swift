//
//  HybridBarcodeScannerOutput.swift
//  VisionCameraBarcodeScanner
//
//  Created by Marc Rousavy on 08.02.26.
//

import AVFoundation
import MLKitBarcodeScanning
import MLKitVision
import NitroModules
import VisionCamera

final class HybridBarcodeScannerOutput: HybridCameraOutputSpec, NativeCameraOutput {
  private let scanner: BarcodeScanner
  private var delegate: BarcodeScannerDelegate? = nil
  private let queue: DispatchQueue
  let output: AVCaptureVideoDataOutput
  let requiresAudioInput: Bool = false
  let requiresDepthFormat: Bool = false
  let mediaType: MediaType = .video
  var outputOrientation: CameraOrientation = .up

  let streamType: StreamType = .video
  var targetResolution: ResolutionRule {
    // TODO: Is this a good size for ML? Lower? Higher?
    //       Maybe a good point to refactor the resolution/format
    //       negotiation in the Constraint system - not sure if all
    //       CameraOutputs should participate in negotiating sizes?
    return .closestTo(Size(width: 720.0, height: 1280.0))
  }

  init(options: BarcodeScannerOutputOptions) {
    self.scanner = BarcodeScanner.barcodeScanner(options: options.toMLKitOptions())
    self.queue = DispatchQueue(label: "com.margelo.camera.barcodescanner")
    self.output = AVCaptureVideoDataOutput()
    super.init()

    // set delegate
    var isScanning = false
    self.delegate = BarcodeScannerDelegate(onSampleBuffer: { [weak self] buffer in
      guard let self else { return }
      if isScanning { return }

      // prepare MLImage
      isScanning = true
      guard let image = MLImage(sampleBuffer: buffer) else {
        options.onError(
          RuntimeError.error(withMessage: "Failed to convert CMSampleBuffer to MLImage!"))
        return
      }
      image.orientation = self.outputOrientation.toUIImageOrientation()
      // start scanning
      self.scanner.process(image) { barcodes, error in
        isScanning = false
        if let barcodes {
          // scanned x barcodes!
          let hybridBarcodes = barcodes.map { HybridBarcode(barcode: $0) }
          options.onBarcodeScanned(hybridBarcodes)
        }
        if let error {
          // error
          options.onError(error)
        }
      }
    })
    self.output.setSampleBufferDelegate(delegate, queue: queue)
    self.output.alwaysDiscardsLateVideoFrames = true
    if #available(iOS 17.0, *), options.outputResolution != .full {
      self.output.automaticallyConfiguresOutputBufferDimensions = false
      self.output.deliversPreviewSizedOutputBuffers = true
    }
  }

  func configure(config: CameraOutputConfiguration) {
    guard let connection = self.output.connection(with: .video) else {
      return
    }
    connection.preferredVideoStabilizationMode = .off
  }
}
