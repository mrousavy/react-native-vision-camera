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
  
  static var outputPixelBufferPool: CVPixelBufferPool? = nil
  static let filter = CIFilter(name: "CIPixellate", parameters: [
    "inputCenter": CIVector(x: 0, y: 0),
    "inputScale": 0.0
  ])!
  static let ciContext = CIContext(mtlDevice: MTLCreateSystemDefaultDevice()!)
  
  static var outputPixelBuffer: CVPixelBuffer?
  static var ciImage: CIImage?
  static var sampleBufferOut: CMSampleBuffer?
  
  static func allocateBufferPool(_ format: CMFormatDescription) -> CVReturn {
    let poolAttributes: NSDictionary? = nil
    let dimensions = CMVideoFormatDescriptionGetDimensions(format)
    let pixelFormat = CMFormatDescriptionGetMediaSubType(format)
    let pixelBufferAttributes: [String: Any] = [
      kCVPixelBufferWidthKey as String: dimensions.width,
      kCVPixelBufferHeightKey as String: dimensions.height,
      kCVPixelBufferPixelFormatTypeKey as String: UInt(pixelFormat),
      kCVPixelBufferIOSurfacePropertiesKey as String: [:]
    ]
    return CVPixelBufferPoolCreate(kCFAllocatorDefault, poolAttributes, pixelBufferAttributes as NSDictionary, &outputPixelBufferPool)
  }
  
  @objc
  public static func callback(_ frame: Frame!, withArgs args: [Any]!) -> Any! {
    // Get the underlying CVImageBuffer from our frame
    guard let imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer),
          let formatDescription = CMSampleBufferGetFormatDescription(frame.buffer) else {
      return nil
    }
    // Ensure we have an ouput pixel buffer pool correctly setup
    if outputPixelBufferPool == nil {
      let poolStatus = allocateBufferPool(formatDescription)
      if poolStatus != kCVReturnSuccess {
        assertionFailure("Pool allocation failed with status: \(poolStatus)")
        return frame
      }
      CVPixelBufferPoolCreatePixelBuffer(kCFAllocatorDefault, outputPixelBufferPool!, &outputPixelBuffer)
    }
    // Process the intensity arg
    if let intensity = args[0] as? CGFloat {
      filter.setValue(intensity, forKey: kCIInputScaleKey)
    }
    // Create a CIImage from the buffer and apply the filter (CI automatically locks the buffer)
    ciImage = CIImage(cvPixelBuffer: imageBuffer)
    filter.setValue(ciImage!, forKey: kCIInputImageKey)
    ciImage = (filter.outputImage)!.cropped(to: ciImage!.extent)
    ciContext.render(ciImage!, to: outputPixelBuffer!, bounds: ciImage!.extent, colorSpace: ciImage!.colorSpace)
    // Return the modified frame to the worklet!
    var outputFormat: CMFormatDescription?
    CMVideoFormatDescriptionCreateForImageBuffer(allocator: kCFAllocatorDefault, imageBuffer: outputPixelBuffer!, formatDescriptionOut: &outputFormat)
    var timingInfo = CMSampleTimingInfo(
      duration: CMSampleBufferGetDuration(frame.buffer),
      presentationTimeStamp: CMSampleBufferGetPresentationTimeStamp(frame.buffer),
      decodeTimeStamp: CMSampleBufferGetDecodeTimeStamp(frame.buffer)
    )
    let createSampleBufferStatus = CMSampleBufferCreateReadyWithImageBuffer(
      allocator: kCFAllocatorDefault,
      imageBuffer: outputPixelBuffer!,
      formatDescription: outputFormat!,
      sampleTiming: &timingInfo,
      sampleBufferOut: &sampleBufferOut
    )
    guard let sampleBufferOut = sampleBufferOut, createSampleBufferStatus != kCMSampleBufferError_AllocationFailed else {
      print("Could not create output sample buffer - failed with status: \(createSampleBufferStatus)")
      return frame
    }
    let outputFrame = Frame(buffer: sampleBufferOut, orientation: frame.orientation)
    return outputFrame
  }
}
