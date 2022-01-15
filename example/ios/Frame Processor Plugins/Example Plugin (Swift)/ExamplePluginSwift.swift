//
//  ExamplePluginSwift.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 30.04.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVKit
import Vision

@objc(ExamplePluginSwift)
public class ExamplePluginSwift: NSObject, FrameProcessorPluginBase {
    @objc
    public static func callback(_ frame: Frame!, withArgs args: [Any]!) -> Any! {
      
      print("FP depth: \(frame.depth!)")
      
      CVPixelBufferLockBaseAddress(frame.depth!, CVPixelBufferLockFlags(rawValue: 0))
      let depthHeight = CVPixelBufferGetHeightOfPlane(frame.depth!, 0)
      let depthWidth = CVPixelBufferGetWidthOfPlane(frame.depth!, 0)
      let bytesPerRow = CVPixelBufferGetBytesPerRowOfPlane(frame.depth!, 0)
      let baseAddress = CVPixelBufferGetBaseAddressOfPlane(frame.depth!, 0)
      let pointer = baseAddress!.assumingMemoryBound(to: UInt8.self)
      let bufferData = UnsafeMutableBufferPointer<UInt8>(start: pointer, count: bytesPerRow * depthHeight)
      CVPixelBufferUnlockBaseAddress(frame.depth!, CVPixelBufferLockFlags(rawValue: 0))
      
      let center = bufferData[(bytesPerRow * Int(depthHeight / 2)) + Int(depthWidth / 2)]
      print("Center screen value: \(center)")
      
//        guard let imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer) else {
//            return nil
//        }
//        NSLog("ExamplePlugin: \(CVPixelBufferGetWidth(imageBuffer)) x \(CVPixelBufferGetHeight(imageBuffer)) Image. Logging \(args.count) parameters:")
//
//        args.forEach { arg in
//            var string = "\(arg)"
//            if let array = arg as? NSArray {
//                string = (array as Array).description
//            } else if let map = arg as? NSDictionary {
//                string = (map as Dictionary).description
//            }
//            NSLog("ExamplePlugin:   -> \(string) (\(type(of: arg)))")
//        }
//
//        return [
//            "example_str": "Test",
//            "example_bool": true,
//            "example_double": 5.3,
//            "example_array": [
//                "Hello",
//                true,
//                17.38,
//            ],
//        ]
      return ["center": center]
    }
}
