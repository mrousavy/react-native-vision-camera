//
//  QRCodeFrameProcessorPlugin.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 30.04.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Vision
import AVKit


class QRCodeFrameProcessorPlugin {
  private func processClassification(for request: VNRequest) {
    DispatchQueue.main.async {
      if let bestResult = request.results?.first as? VNBarcodeObservation,
         let payload = bestResult.payloadStringValue {
        if bestResult.symbology == .QR {
          guard let data = payload.data(using: .utf8) else { return }
          guard let jsonString = String(data: data, encoding: .utf8) else { return }
          print("JSON Data: " + jsonString)
        }
      }
    }
  }
  
  private lazy var detectBarcodeRequest: VNDetectBarcodesRequest = {
    return VNDetectBarcodesRequest(completionHandler: { (request, error) in
      guard error == nil else { return }
      self.processClassification(for: request)
    })
  }()
  
  func scanQRCode(buffer: CMSampleBuffer?) {
    guard let buffer = buffer else { return }
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(buffer) else { return }
    
    var requestOptions: [VNImageOption : Any] = [:]
    
    if let camData = CMGetAttachment(buffer, key: kCMSampleBufferAttachmentKey_CameraIntrinsicMatrix, attachmentModeOut: nil) {
      requestOptions = [.cameraIntrinsics : camData]
    }

    let imageRequestHandler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: .up, options: requestOptions)
    try? imageRequestHandler.perform([detectBarcodeRequest])
  }
  
  init() {
    FrameProcessorPluginRegistry.addFrameProcessorPlugin("scanQRCode", callback: self.scanQRCode)
  }
}
