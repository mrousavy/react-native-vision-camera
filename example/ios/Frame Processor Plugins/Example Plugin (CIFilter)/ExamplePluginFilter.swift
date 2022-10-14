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
  
  static var outputSize = CGSize.zero
  static var outputPixelBufferPool: CVPixelBufferPool? = nil
  static let filter = CIFilter(name: "CIBumpDistortion", parameters: [
    "inputCenter": CIVector(x: 0, y: 0),
    "inputRadius": 0.0,
    "inputScale": 0.0
  ])!
  static let ciContext = CIContext(mtlDevice: MTLCreateSystemDefaultDevice()!)
  
  static func allocateBufferPool(_ width: Int, _ height: Int, _ pixelFormat: FourCharCode) -> CVReturn {
    print("Allocating new pixel buffer output pool with size: \(width) x \(height)")
    let poolAttributes: NSDictionary? = nil
    let pixelBufferAttributes: [String: Any] = [
      kCVPixelBufferWidthKey as String: width,
      kCVPixelBufferHeightKey as String: height,
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
    let bufferWidth = CVPixelBufferGetWidth(imageBuffer)
    let bufferHeight = CVPixelBufferGetHeight(imageBuffer)
    // Ensure we have an output pixel buffer pool correctly setup (in this case matching the input dimensions)
    if bufferWidth != Int(outputSize.width) || bufferHeight != Int(outputSize.height) {
      outputPixelBufferPool = nil
      outputSize = CGSize(width: bufferWidth, height: bufferHeight)
      let pixelFormat = CMFormatDescriptionGetMediaSubType(formatDescription)
      let poolStatus = allocateBufferPool(
        bufferWidth,
        bufferHeight,
        pixelFormat
      )
      if poolStatus != kCVReturnSuccess {
        assertionFailure("Pool allocation failed with status: \(poolStatus)")
        return frame
      }
    }
    var outputPixelBuffer: CVPixelBuffer?
    CVPixelBufferPoolCreatePixelBuffer(kCFAllocatorDefault, outputPixelBufferPool!, &outputPixelBuffer)
    // Set the input center based on the image size
    filter.setValue(
      CIVector(
        x: CGFloat(bufferWidth / 2),
        y: CGFloat(bufferHeight / 2)
      ),
      forKey: kCIInputCenterKey
    )
    filter.setValue(
      CGFloat(bufferWidth / 2),
      forKey: kCIInputRadiusKey
    )
    // Process the intensity arg
    if let intensity = args[0] as? CGFloat {
      filter.setValue(intensity, forKey: kCIInputScaleKey)
    }
    // Create a CIImage from the buffer and apply the filter (CI automatically locks the buffer)
    var ciImage = CIImage(cvPixelBuffer: imageBuffer)
    filter.setValue(ciImage, forKey: kCIInputImageKey)
    ciImage = (filter.outputImage)!.cropped(to: ciImage.extent)
    ciContext.render(ciImage, to: outputPixelBuffer!)
    // Return the modified frame to the worklet!
    var outputFormat: CMFormatDescription?
    CMVideoFormatDescriptionCreateForImageBuffer(allocator: kCFAllocatorDefault, imageBuffer: outputPixelBuffer!, formatDescriptionOut: &outputFormat)
    var timingInfo = CMSampleTimingInfo(
      duration: CMSampleBufferGetDuration(frame.buffer),
      presentationTimeStamp: CMSampleBufferGetPresentationTimeStamp(frame.buffer),
      decodeTimeStamp: CMSampleBufferGetDecodeTimeStamp(frame.buffer)
    )
    var sampleBufferOut: CMSampleBuffer?
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
    let outputFrame = Frame(retainedBuffer: sampleBufferOut, orientation: frame.orientation)
    return outputFrame
  }
}
