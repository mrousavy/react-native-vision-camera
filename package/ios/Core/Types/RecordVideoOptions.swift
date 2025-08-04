//
//  RecordVideoOptions.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 12.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

struct RecordVideoOptions {
  var fileType: AVFileType = .mov
  var flash: Torch = .off
  var codec: AVVideoCodecType?
  var path: URL
  /**
   * Full Bit-Rate override for the Video Encoder, in Megabits per second (Mbps)
   */
  var bitRateOverride: Double?
  /**
   * A multiplier applied to whatever the currently set bit-rate is, whether it's automatically computed by the OS Encoder,
   * or set via bitRate, in Megabits per second (Mbps)
   */
  var bitRateMultiplier: Double?
  var width: Int?
  var height: Int?
  
  struct CropRect {
    var x: CGFloat
    var y: CGFloat
    var width: CGFloat
    var height: CGFloat
    
    static let `default` = CropRect(x: 0, y: 0, width: 1, height: 1)
  }
  var crop: CropRect?

  init(fromJSValue dictionary: NSDictionary, bitRateOverride: Double? = nil, bitRateMultiplier: Double? = nil) throws {
    // File Type (.mov or .mp4)
    if let fileTypeOption = dictionary["fileType"] as? String {
      fileType = try AVFileType(withString: fileTypeOption)
    }
    // Flash
    if let flashOption = dictionary["flash"] as? String {
      flash = try Torch(jsValue: flashOption)
    }
    // Codec
    if let codecOption = dictionary["videoCodec"] as? String {
      codec = try AVVideoCodecType(withString: codecOption)
    }
    // BitRate Override
    self.bitRateOverride = bitRateOverride
    // BitRate Multiplier
    self.bitRateMultiplier = bitRateMultiplier
    // Width
    if let width = dictionary["width"] as? NSNumber {
      self.width = width.intValue
    }
    // Height
    if let height = dictionary["height"] as? NSNumber {
      self.height = height.intValue
    }
    // Parse crop region if provided
    if let cropDict = dictionary["crop"] as? [String: Any] {
      let x = cropDict["left"] as? NSNumber ?? 0
      let y = cropDict["top"] as? NSNumber ?? 0
      let width = cropDict["width"] as? NSNumber ?? 1
      let height = cropDict["height"] as? NSNumber ?? 1
      
      self.crop = CropRect(
        x: CGFloat(truncating: x),
        y: CGFloat(truncating: y),
        width: CGFloat(truncating: width),
        height: CGFloat(truncating: height)
      )
    }
    // Custom Path
    let fileExtension = fileType.descriptor ?? "mov"
    if let customPath = dictionary["path"] as? String {
      path = try FileUtils.getFilePath(customDirectory: customPath, fileExtension: fileExtension)
    } else {
      path = try FileUtils.getFilePath(fileExtension: fileExtension)
    }
  }
}
