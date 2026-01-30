//
//  AVCaptureVideoDataOutput+recommendedVideoSettings.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 22.11.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation
import VideoToolbox

extension AVCaptureVideoDataOutput {
  private func supportsCodec(_ videoCodec: AVVideoCodecType, writingTo fileType: AVFileType) -> Bool {
    let availableCodecs = availableVideoCodecTypesForAssetWriter(writingTo: fileType)
    return availableCodecs.contains(videoCodec)
  }

  /// Returns true if the given settings dictionary uses a non-standard codec
  /// (anything other than H.264 or HEVC, e.g. ProRes, ProRes RAW).
  private func isNonStandardCodec(in settings: [String: Any]?) -> Bool {
    guard let codecValue = settings?[AVVideoCodecKey] as? String else { return false }
    return codecValue != AVVideoCodecType.h264.rawValue && codecValue != AVVideoCodecType.hevc.rawValue
  }

  /// Returns true if the pixel format is a known 8-bit format (safe for HEVC Main profile)
  private func isConfirmed8BitPixelFormat(_ pixelFormat: OSType?) -> Bool {
    guard let pf = pixelFormat else { return false }
    return [
      kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange, // 420v
      kCVPixelFormatType_420YpCbCr8BiPlanarFullRange, // 420f
      kCVPixelFormatType_32BGRA, // BGRA
      kCVPixelFormatType_32ARGB, // ARGB
      kCVPixelFormatType_32RGBA, // RGBA
    ].contains(pf)
  }

  /**
   Get the recommended options for an [AVAssetWriter] with the desired [RecordVideoOptions].

   - Parameter options: The recording options (codec, file type, bitrate, etc.)
   - Parameter devicePixelFormat: The actual pixel format from the device's active format.
     This is critical for correct HEVC profile selection on devices with 10-bit sensors (iPhone 14 Pro+).
   - Parameter forceH264: If true, force H.264 codec regardless of other settings.
   */
  func recommendedVideoSettings(forOptions options: RecordVideoOptions,
                                devicePixelFormat: OSType? = nil,
                                forceH264: Bool = false) throws -> [String: Any] {
    var settings: [String: Any]?
    let isConfirmed8Bit = isConfirmed8BitPixelFormat(devicePixelFormat)

    VisionLogger.log(level: .info,
                     message: "Getting recommended video settings for \(options.fileType) file " +
                       "(codec: \(options.codec?.rawValue ?? "default"), forceH264: \(forceH264))...")
    VisionLogger.log(level: .info,
                     message: "Device pixel format: \(devicePixelFormat.map { String(format: "0x%08X", $0) } ?? "nil"), " +
                       "isConfirmed8Bit: \(isConfirmed8Bit)")

    // If forceH264 is set, skip all other codecs and go straight to H.264
    if forceH264 {
      VisionLogger.log(level: .warning, message: "Forcing H.264 codec for maximum compatibility...")
      if supportsCodec(.h264, writingTo: options.fileType) {
        settings = recommendedVideoSettings(forVideoCodecType: .h264, assetWriterOutputFileType: options.fileType)
        if let codecValue = settings?[AVVideoCodecKey] as? String, codecValue != AVVideoCodecType.h264.rawValue {
          VisionLogger.log(level: .warning,
                           message: "recommendedVideoSettings returned \(codecValue) instead of H.264, overriding...")
          settings?[AVVideoCodecKey] = AVVideoCodecType.h264.rawValue
        }
      }
    }

    // If not forcing H.264 or H.264 isn't available, try normal codec selection
    if settings == nil {
      let preferredCodec: AVVideoCodecType = options.codec ?? .hevc

      // Strategy 1: Try the preferred codec
      if supportsCodec(preferredCodec, writingTo: options.fileType) {
        VisionLogger.log(level: .info, message: "Using preferred codec \(preferredCodec.rawValue)...")
        settings = recommendedVideoSettings(forVideoCodecType: preferredCodec, assetWriterOutputFileType: options.fileType)
      }

      // Strategy 2: If preferred codec returned ProRes settings or wasn't supported, try HEVC
      if settings == nil || isNonStandardCodec(in: settings) {
        if preferredCodec != .hevc && supportsCodec(.hevc, writingTo: options.fileType) {
          VisionLogger.log(level: .warning, message: "Preferred codec returned non-standard settings. Trying HEVC...")
          settings = recommendedVideoSettings(forVideoCodecType: .hevc, assetWriterOutputFileType: options.fileType)
        }
      }

      // Strategy 3: Try H.264
      if settings == nil || isNonStandardCodec(in: settings) {
        if supportsCodec(.h264, writingTo: options.fileType) {
          VisionLogger.log(level: .warning, message: "HEVC returned non-standard settings. Trying H.264...")
          settings = recommendedVideoSettings(forVideoCodecType: .h264, assetWriterOutputFileType: options.fileType)
        }
      }

      // Strategy 4: Default recommended settings
      if settings == nil {
        VisionLogger.log(level: .warning, message: "No codec-specific settings available. Using default...")
        settings = recommendedVideoSettingsForAssetWriter(writingTo: options.fileType)
      }
    }

    guard var settings else {
      throw CameraError.capture(.createRecorderError(message: "Failed to get video settings!"))
    }

    // Safety check: On devices like iPhone 14 Pro+ and iPhone 16/17, even codec-specific
    // recommended settings may return ProRes/ProRes RAW codec settings that require
    // SMPTE RDD18 metadata (ISO sensitivity, white balance, etc.) which this library
    // does not provide. Force-override any non-standard codec to a compatible one.
    if isNonStandardCodec(in: settings) {
      let originalCodec = settings[AVVideoCodecKey] as? String ?? "nil"
      let fallbackCodec: AVVideoCodecType = (forceH264 || isConfirmed8Bit) ? .h264 : .hevc
      VisionLogger.log(level: .warning,
                       message: "Overriding non-standard codec \(originalCodec) → \(fallbackCodec.rawValue)")
      settings[AVVideoCodecKey] = fallbackCodec.rawValue

      // Strip any ProRes-specific compression properties that may be incompatible
      if var compressionProps = settings[AVVideoCompressionPropertiesKey] as? [String: Any] {
        let standardKeys: Set<String> = [
          AVVideoAverageBitRateKey,
          AVVideoExpectedSourceFrameRateKey,
          AVVideoMaxKeyFrameIntervalKey,
          AVVideoMaxKeyFrameIntervalDurationKey,
          AVVideoProfileLevelKey,
          AVVideoQualityKey,
        ]
        compressionProps = compressionProps.filter { standardKeys.contains($0.key) }
        settings[AVVideoCompressionPropertiesKey] = compressionProps
      }
    }

    // Set correct profile based on codec
    let codecKey = settings[AVVideoCodecKey] as? String
    if codecKey == AVVideoCodecType.hevc.rawValue {
      var compressionProps = settings[AVVideoCompressionPropertiesKey] as? [String: Any] ?? [:]
      // Use Main10 profile for HEVC - it can encode both 8-bit and 10-bit content
      // with no quality loss. This eliminates -12905 errors entirely.
      VisionLogger.log(level: .info, message: "Setting HEVC Main10 profile for universal compatibility")
      compressionProps[AVVideoProfileLevelKey] = kVTProfileLevel_HEVC_Main10_AutoLevel as String
      settings[AVVideoCompressionPropertiesKey] = compressionProps
    } else if codecKey == AVVideoCodecType.h264.rawValue {
      var compressionProps = settings[AVVideoCompressionPropertiesKey] as? [String: Any] ?? [:]
      VisionLogger.log(level: .info, message: "Setting H.264 High profile for best compatibility")
      compressionProps[AVVideoProfileLevelKey] = AVVideoProfileLevelH264HighAutoLevel
      settings[AVVideoCompressionPropertiesKey] = compressionProps
    }

    if let bitRateOverride = options.bitRateOverride {
      // Convert from Mbps -> bps
      let bitsPerSecond = bitRateOverride * 1_000_000
      if settings[AVVideoCompressionPropertiesKey] == nil {
        settings[AVVideoCompressionPropertiesKey] = [:]
      }
      var compressionSettings = settings[AVVideoCompressionPropertiesKey] as? [String: Any] ?? [:]
      let currentBitRate = compressionSettings[AVVideoAverageBitRateKey] as? NSNumber
      VisionLogger.log(level: .info,
                       message: "Setting Video Bit-Rate from \(currentBitRate?.doubleValue.description ?? "nil") bps " +
                         "to \(bitsPerSecond) bps...")

      compressionSettings[AVVideoAverageBitRateKey] = NSNumber(value: bitsPerSecond)
      settings[AVVideoCompressionPropertiesKey] = compressionSettings
    }

    if let bitRateMultiplier = options.bitRateMultiplier {
      // Check if the bit-rate even exists in the settings
      if var compressionSettings = settings[AVVideoCompressionPropertiesKey] as? [String: Any],
         let currentBitRate = compressionSettings[AVVideoAverageBitRateKey] as? NSNumber {
        // Multiply the current value by the given multiplier
        let newBitRate = Int(currentBitRate.doubleValue * bitRateMultiplier)
        VisionLogger.log(level: .info, message: "Setting Video Bit-Rate from \(currentBitRate) bps to \(newBitRate) bps...")

        compressionSettings[AVVideoAverageBitRateKey] = NSNumber(value: newBitRate)
        settings[AVVideoCompressionPropertiesKey] = compressionSettings
      }
    }

    return settings
  }
}
