///
/// ResolvableConstraint+Colorspace.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation

extension VideoDynamicRangeConstraint: ResolvableConstraint {
  typealias ResolvedValue = TargetDynamicRange

  func resolve(for format: AVCaptureDevice.Format) -> ConstraintResolution<TargetDynamicRange> {
    return videoDynamicRange.resolve(for: format)
  }
}

extension TargetDynamicRange {
  /// Resolves the target dynamic range against the format's actual capabilities.
  /// Returns the achievable dynamic range (using format's actual bit depth + color range,
  /// and the best available color space from the fallback chain).
  func resolve(for format: AVCaptureDevice.Format) -> ConstraintResolution<TargetDynamicRange> {
    let targetBitDepth = self.bitDepth
    let actualBitDepth = format.formatDescription.mediaSubType.bitDepth
    let bitDepthPenalty = targetBitDepth.penalty(to: actualBitDepth)

    let colorSpaceResolution = self.colorSpace.resolve(for: format)

    let targetColorRange = self.colorRange.toColorRange()
    let actualColorRange = format.formatDescription.mediaSubType.colorRange
    let colorRangePenalty = targetColorRange.penalty(to: actualColorRange)

    let totalPenalty = Double(bitDepthPenalty + Int(colorSpaceResolution.penalty.distance) + colorRangePenalty)

    // Build the resolved dynamic range from what the format actually supports
    let resolvedDynamicRange = TargetDynamicRange(
      bitDepth: actualBitDepth.toTargetBitDepth(),
      colorSpace: colorSpaceResolution.resolvedValue,
      colorRange: actualColorRange.toTargetColorRange())

    return ConstraintResolution(
      penalty: ConstraintPenalty(distance: totalPenalty),
      resolvedValue: resolvedDynamicRange)
  }
}

// MARK: - Color Space

extension TargetColorSpace {
  fileprivate func nextBestMode() -> TargetColorSpace {
    switch self {
    case .srgb:
      return .srgb
    case .p3D65:
      return .srgb
    case .hlgBt2020:
      return .p3D65
    case .appleLog:
      return .hlgBt2020
    case .appleLog2:
      return .appleLog
    case .dolbyVision:
      // Dolby Vision is not supported on iOS
      return .hlgBt2020
    }
  }

  /// Walks the color space fallback chain until we find one the format supports.
  /// Returns both the penalty (number of fallback steps) and the resolved color space.
  func resolve(for format: AVCaptureDevice.Format) -> ConstraintResolution<TargetColorSpace> {
    var penalty = 0
    var currentColorSpace = self
    while currentColorSpace != .srgb {
      if format.supportedColorSpaces.contains(currentColorSpace.toAVCaptureColorSpace()) {
        break
      }
      currentColorSpace = currentColorSpace.nextBestMode()
      penalty += 1
    }
    return ConstraintResolution(
      penalty: ConstraintPenalty(distance: Double(penalty)),
      resolvedValue: currentColorSpace)
  }
}

// MARK: - Color Range

extension CMFormatDescription.MediaSubType {
  fileprivate var colorRange: ColorRange {
    switch self {
    case .yuv4208BitVideo, .yuv42010BitVideo, .yuv4228BitVideo, .yuv42210BitVideo:
      return .video
    case .yuv4208BitFull, .yuv42010BitFull, .yuv4228BitFull, .yuv42210BitFull:
      return .full
    default:
      return .unknown
    }
  }
}
extension TargetColorRange {
  fileprivate func toColorRange() -> ColorRange {
    switch self {
    case .video:
      return .video
    case .full:
      return .full
    }
  }
}
extension ColorRange {
  fileprivate func penalty(to target: ColorRange) -> Int {
    switch (self, target) {
    case (.video, .video), (.full, .full):
      return 0
    case (.video, .full):
      return 1
    case (.full, .video):
      return 2
    case (_, .unknown), (.unknown, _):
      return 3
    }
  }

  fileprivate func toTargetColorRange() -> TargetColorRange {
    switch self {
    case .full:
      return .full
    case .video, .unknown:
      return .video
    }
  }
}

// MARK: - Bit Depth

extension CMFormatDescription.MediaSubType {
  var bitDepth: DynamicRangeBitDepth {
    switch self {
    case .yuv4208BitVideo, .yuv4208BitFull, .yuv4228BitVideo, .yuv4228BitFull:
      return .sdr8Bit
    case .yuv42010BitVideo, .yuv42010BitFull, .yuv42210BitVideo, .yuv42210BitFull:
      return .hdr10Bit
    default:
      return .unknown
    }
  }
}
extension TargetDynamicRangeBitDepth {
  fileprivate func penalty(to target: DynamicRangeBitDepth) -> Int {
    switch (self, target) {
    case (.sdr8Bit, .sdr8Bit), (.hdr10Bit, .hdr10Bit):
      return 0
    case (.sdr8Bit, .hdr10Bit):
      return 1
    case (.hdr10Bit, .sdr8Bit):
      return 2
    case (_, .unknown):
      return 3
    }
  }
}
extension DynamicRangeBitDepth {
  fileprivate func toTargetBitDepth() -> TargetDynamicRangeBitDepth {
    switch self {
    case .hdr10Bit:
      return .hdr10Bit
    case .sdr8Bit, .unknown:
      return .sdr8Bit
    }
  }
}
