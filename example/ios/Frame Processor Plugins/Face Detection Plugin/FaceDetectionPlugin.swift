//
//  FaceDetectionPlugin.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 30.04.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVKit
import Vision

@objc(FaceDetectionPlugin)
public class FaceDetectionPlugin: NSObject, FrameProcessorPluginBase {
  
  static func convertOrientation(_ orientation: UIImage.Orientation) -> CGImagePropertyOrientation {
    switch (orientation) {
    case .down:
      return .down
    case .downMirrored:
      return .downMirrored
    case .left:
      return .left
    case .leftMirrored:
      return .leftMirrored
    case .right:
      return .right
    case .rightMirrored:
      return .rightMirrored
    case .up:
      return .up
    case .upMirrored:
      return .upMirrored
    @unknown default:
      fatalError("Unknown Orientation!")
    }
  }
  
  private static var requests: [VNRequest] = [VNDetectFaceRectanglesRequest()]
  
  @objc
  public static func callback(_ frame: Frame!, withArgs args: [Any]!) -> Any! {
    guard let imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer) else { return nil }
    
    

    var requestOptions: [VNImageOption : Any] = [:]
    if let cameraIntrinsicData = CMGetAttachment(frame.buffer,
                                                 key: kCMSampleBufferAttachmentKey_CameraIntrinsicMatrix,
                                                 attachmentModeOut: nil) {
      requestOptions = [.cameraIntrinsics : cameraIntrinsicData]
    }

    let imageRequestHandler = VNImageRequestHandler(cvPixelBuffer: imageBuffer,
                                                    orientation: convertOrientation(frame.orientation),
                                                    options: requestOptions)
    do {
      try imageRequestHandler.perform(requests)
      
      if let results = requests[0].results as? [VNFaceObservation] {
        return results.map { face in
          return [
            "x": face.boundingBox.origin.x,
            "y": face.boundingBox.origin.y,
            "width": face.boundingBox.width,
            "height": face.boundingBox.height
          ]
        }
      }
      
    } catch {
      print("Failed to Perform Image Request!")
    }
    
    return []
  }
}
