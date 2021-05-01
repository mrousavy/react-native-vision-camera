//
//  QRCodeFrameProcessorPlugin.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 30.04.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Vision
import AVKit

@objc(QRCodeFrameProcessorPlugin)
public class QRCodeFrameProcessorPlugin : NSObject, FrameProcessorPluginBase {
  private static func processClassification(for request: VNRequest) {
    if let bestResult = request.results?.first as? VNBarcodeObservation,
       let payload = bestResult.payloadStringValue {
      if bestResult.symbology == .QR {
        guard let data = payload.data(using: .utf8) else { return }
        guard let jsonString = String(data: data, encoding: .utf8) else { return }
        print("QR Code: \(jsonString)")
      }
    }
  }
  
  private static var detectBarcodeRequest: VNDetectBarcodesRequest = {
    return VNDetectBarcodesRequest(completionHandler: { (request, error) in
      guard error == nil else { return }
      processClassification(for: request)
    })
  }()
  
  @objc(callback:)
  public static func callback(_ buffer: CMSampleBuffer!) -> Any! {
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(buffer) else { return nil }
    
    var requestOptions: [VNImageOption : Any] = [:]
    
    if let camData = CMGetAttachment(buffer, key: kCMSampleBufferAttachmentKey_CameraIntrinsicMatrix, attachmentModeOut: nil) {
      requestOptions = [.cameraIntrinsics : camData]
    }

    let imageRequestHandler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: .up, options: requestOptions)
    try? imageRequestHandler.perform([detectBarcodeRequest])
    return []
  }
}
