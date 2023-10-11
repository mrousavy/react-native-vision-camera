//
//  CameraConfiguration.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 11.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import Foundation
import AVFoundation

class CameraConfiguration {
  // pragma MARK: Dirty Flags
  
  private(set) var requiresDeviceConfiguration = false {
    
    didSet {
      requiresOutputsConfiguration = requiresDeviceConfiguration
    }
  }
  private(set) var requiresOutputsConfiguration = false {
    didSet {
      requiresFormatConfiguration = requiresOutputsConfiguration
    }
  }
  private(set) var requiresFormatConfiguration = false {
    didSet {
      requiresSidePropsConfiguration = requiresFormatConfiguration
    }
  }
  private(set) var requiresSidePropsConfiguration = false {
    didSet {
      requiresZoomConfiguration = requiresSidePropsConfiguration
    }
  }
  private(set) var requiresZoomConfiguration = false {
    didSet {
      requiresRunningCheck = true
    }
  }
  private(set) var requiresRunningCheck = false
  
  var isDirty: Bool {
    get {
      return requiresDeviceConfiguration || requiresOutputsConfiguration || requiresFormatConfiguration || requiresSidePropsConfiguration || requiresZoomConfiguration 
    }
  }
  
  // pragma MARK: Configuration Props
  
  // Input
  var cameraId: String? = nil {
    didSet {
      requiresDeviceConfiguration = true
    }
  }
  // Outputs
  var photo: OutputConfiguration<Photo> = .disabled {
    didSet {
      requiresOutputsConfiguration = true
    }
  }
  var video: OutputConfiguration<Video> = .disabled {
    didSet {
      requiresOutputsConfiguration = true
    }
  }
  var codeScanner: OutputConfiguration<CodeScanner> = .disabled {
    didSet {
      requiresOutputsConfiguration = true
    }
  }
  // Format
  var format: NSDictionary? = nil {
    didSet {
      requiresFormatConfiguration = true
    }
  }
  // Side-Props
  var fps: Int32? = nil {
    didSet {
      requiresSidePropsConfiguration = true
    }
  }
  var enableLowLightBoost: Bool = false {
    didSet {
      requiresSidePropsConfiguration = true
    }
  }
  // Zoom
  var zoom: CGFloat? = nil {
    didSet {
      requiresZoomConfiguration = true
    }
  }
  // isActive (Start/Stop)
  var isActive: Bool = false {
    didSet {
      requiresRunningCheck = true
    }
  }
  
  // pragma MARK: Types
  
  enum OutputConfiguration<T> {
    case disabled
    case enabled(config: T)
  }
  
  /**
   A Photo Output configuration
   */
  struct Photo {
    var enableHighQualityPhotos: Bool = false
    var enableDepthData: Bool = false
    var enablePortraitEffectsMatte: Bool = false
  }
  
  /**
   A Video Output configuration
   */
  struct Video {
    var pixelFormat: PixelFormat = .native
    var enableBufferCompression = false
    var enableHdr = false
    var enableFrameProcessor = false
  }
  
  // pragma MARK: Helper Functions
  
  /**
   Returns the pixel format that should be used for the AVCaptureVideoDataOutput.
   If HDR is enabled, this will return YUV 4:2:0 10-bit.
   If HDR is disabled, this will return whatever the user specified as a pixelFormat, or the most efficient format as a fallback.
   */
  func getPixelFormat(videoOutput: AVCaptureVideoDataOutput) throws -> OSType {
    guard case let .enabled(video) = video else {
      throw CameraError.capture(.videoNotEnabled)
    }
    
    // as per documentation, the first value is always the most efficient format
    var defaultFormat = videoOutput.availableVideoPixelFormatTypes.first!
    if video.enableBufferCompression {
      // use compressed format instead if we enabled buffer compression
      if defaultFormat == kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange &&
        videoOutput.availableVideoPixelFormatTypes.contains(kCVPixelFormatType_Lossless_420YpCbCr8BiPlanarVideoRange) {
        // YUV 4:2:0 8-bit (limited video colors; compressed)
        defaultFormat = kCVPixelFormatType_Lossless_420YpCbCr8BiPlanarVideoRange
      }
      if defaultFormat == kCVPixelFormatType_420YpCbCr8BiPlanarFullRange &&
        videoOutput.availableVideoPixelFormatTypes.contains(kCVPixelFormatType_Lossless_420YpCbCr8BiPlanarFullRange) {
        // YUV 4:2:0 8-bit (full video colors; compressed)
        defaultFormat = kCVPixelFormatType_Lossless_420YpCbCr8BiPlanarFullRange
      }
    }

    // If the user enabled HDR, we can only use the YUV 4:2:0 10-bit pixel format.
    if video.enableHdr == true {
      guard video.pixelFormat == .native || video.pixelFormat == .yuv else {
        throw CameraError.format(.incompatiblePixelFormatWithHDR)
      }

      var targetFormats = [kCVPixelFormatType_420YpCbCr10BiPlanarFullRange,
                           kCVPixelFormatType_420YpCbCr10BiPlanarVideoRange]
      if video.enableBufferCompression {
        // If we enable buffer compression, try to use a lossless compressed YUV format first, otherwise fall back to the others.
        targetFormats.insert(kCVPixelFormatType_Lossless_420YpCbCr10PackedBiPlanarVideoRange, at: 0)
      }

      // Find the best matching format
      guard let format = videoOutput.findPixelFormat(firstOf: targetFormats) else {
        throw CameraError.format(.invalidHdr)
      }
      // YUV 4:2:0 10-bit (compressed/uncompressed)
      return format
    }

    // If we don't use HDR, we can use any other custom pixel format.
    switch video.pixelFormat {
    case .yuv:
      // YUV 4:2:0 8-bit (full/limited video colors; uncompressed)
      var targetFormats = [kCVPixelFormatType_420YpCbCr8BiPlanarFullRange,
                           kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange]
      if video.enableBufferCompression {
        // YUV 4:2:0 8-bit (full/limited video colors; compressed)
        targetFormats.insert(kCVPixelFormatType_Lossless_420YpCbCr8BiPlanarVideoRange, at: 0)
        targetFormats.insert(kCVPixelFormatType_Lossless_420YpCbCr8BiPlanarFullRange, at: 0)
      }
      guard let format = videoOutput.findPixelFormat(firstOf: targetFormats) else {
        throw CameraError.device(.pixelFormatNotSupported)
      }
      return format
    case .rgb:
      // RGBA 8-bit (uncompressed)
      var targetFormats = [kCVPixelFormatType_32BGRA]
      if video.enableBufferCompression {
        // RGBA 8-bit (compressed)
        targetFormats.insert(kCVPixelFormatType_Lossless_32BGRA, at: 0)
      }
      guard let format = videoOutput.findPixelFormat(firstOf: targetFormats) else {
        throw CameraError.device(.pixelFormatNotSupported)
      }
      return format
    case .native:
      return defaultFormat
    case .unknown:
      throw CameraError.parameter(.invalid(unionName: "pixelFormat", receivedValue: "unknown"))
    }
  }
}
