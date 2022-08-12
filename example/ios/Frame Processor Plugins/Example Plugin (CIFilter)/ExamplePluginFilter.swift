//
//  ExamplePluginFilter.swift
//  VisionCameraExample
//
//  Created by Thomas Coldwell on 12/08/2022.
//  Copyright © 2022 Thomas Coldwell. All rights reserved.
//

import AVKit
import Vision

@objc(ExamplePluginFilter)
public class ExamplePluginFilter: NSObject, FrameProcessorPluginBase {
  
    static let filter = CIFilter(name: "CIPixellate", parameters: [
      "inputCenter": CIVector(x: 0, y: 0),
      "inputScale": 0.0
    ])!
    static let ciContext = CIContext(mtlDevice: MTLCreateSystemDefaultDevice()!)
  
    @objc
    public static func callback(_ frame: Frame!, withArgs args: [Any]!) -> Any! {
        // Get the underlying CVImageBuffer from our frame
        guard let imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer) else {
            return nil
        }
        // Process the intensity arg
        if let intensity = args[0] as? CGFloat {
          filter.setValue(intensity, forKey: kCIInputScaleKey)
        }
        // Lock the buffer while we read and write to it
        CVPixelBufferLockBaseAddress(imageBuffer, CVPixelBufferLockFlags(rawValue: 0))
        // Create a CIImage from the buffer and apply the filter
        var ciImage = CIImage(cvPixelBuffer: imageBuffer)
        filter.setValue(ciImage, forKey: kCIInputImageKey)
        ciImage = (filter.outputImage)!.cropped(to: ciImage.extent)
        ciContext.render(ciImage, to: imageBuffer)
        CVPixelBufferUnlockBaseAddress(imageBuffer, CVPixelBufferLockFlags(rawValue: 0))
        // Return the modified frame to the worklet!
        return frame
    }
}
