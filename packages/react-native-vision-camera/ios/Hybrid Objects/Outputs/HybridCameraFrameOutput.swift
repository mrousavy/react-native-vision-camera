///
/// HybridCameraFrameOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

class HybridCameraFrameOutput: HybridCameraFrameOutputSpec, NativeCameraOutput {
  private let delegate: FrameDelegate
  private let queue: DispatchQueue
  private let queueSpecificKey = DispatchSpecificKey<Void>()
  private var mirrorMode: MirrorMode = .auto
  private let options: FrameOutputOptions
  let mediaType: MediaType = .video
  let requiresAudioInput: Bool = false
  let requiresDepthFormat: Bool = false
  let output: AVCaptureVideoDataOutput
  lazy var thread: any HybridNativeThreadSpec = {
    return HybridNativeThread(queue: queue)
  }()
  var outputOrientation: CameraOrientation = .up {
    didSet {
      guard let connection = output.connection(with: .video) else { return }
      if options.enablePhysicalBufferRotation {
        // TODO: Should we apply that within the CameraSession's DispatchQueue? Batch it?
        try? connection.setOrientation(outputOrientation)
      }
    }
  }

  var streamType: StreamType = .video
  var targetResolution: ResolutionRule {
    if options.allowPhysicalBufferResizing {
      // Opt out of negotiation — the CameraSession picks whatever format is best for the
      // other outputs, and we pin our buffer size via `videoSettings` in `configure(...)`.
      return .any
    }
    return .closestTo(options.targetResolution)
  }

  init(options: FrameOutputOptions) {
    self.output = AVCaptureVideoDataOutput()
    self.delegate = FrameDelegate()
    self.options = options
    self.queue = DispatchQueue(
      label: "com.margelo.camera.frame",
      qos: .userInteractive,
      attributes: [],
      autoreleaseFrequency: .inherit,
      target: nil)
    self.queue.setSpecific(key: queueSpecificKey, value: ())
    super.init()

    // Set up our `delegate`
    output.setSampleBufferDelegate(delegate, queue: queue)
    // Configure `videoSettings`
    output.videoSettings = videoSettingsForPixelFormat(options.pixelFormat)
    // If the pipeline stalls, drop frames to avoid blowing up RAM
    output.alwaysDiscardsLateVideoFrames = options.dropFramesWhileBusy
    // JS configures the video resolution, we don't want to downscale here by default.
    output.automaticallyConfiguresOutputBufferDimensions = false
    if #available(iOS 26.0, *), output.isDeferredStartSupported {
      // Deferred start allows the Session to delay this output's startup in favor
      // of preview-related outputs to make preview appear faster.
      output.isDeferredStartEnabled = options.allowDeferredStart
    }
    if #available(iOS 26.0, *) {
      // We don't need HDR metadata, as that's only useful for encoders.
      output.preservesDynamicHDRMetadata = false
    }
  }

  func configure(config: CameraOutputConfiguration) {
    // TODO: Somehow attach this to `connection`, so we dont have race conditions
    //       where we read `self.mirrorMode` for an old Frame in `getMediaSampleMetadata`
    self.mirrorMode = config.mirrorMode

    guard let connection = output.connection(with: .video) else {
      return
    }
    if options.enablePhysicalBufferRotation {
      // Pipeline should physically rotate buffers on the `connection`
      try? connection.setOrientation(outputOrientation)
      try? connection.setMirrorMode(config.mirrorMode)
    }
    if options.enableCameraMatrixDelivery {
      // Pipeline should deliver camera matrix (via attachment on `CMSampleBuffer`)
      if connection.isCameraIntrinsicMatrixDeliverySupported {
        connection.isCameraIntrinsicMatrixDeliveryEnabled = true
      }
    }
    if #available(iOS 16.0, *), options.allowPhysicalBufferResizing {
      // We opted out of resolution negotiation via `targetResolution = .any`; pin our
      // delivered buffer size here via `videoSettings`. iOS 16+ enforces that the
      // requested W/H match the active format's aspect ratio (corrected for the
      // connection's videoOrientation) and do not exceed its native dimensions.
      if let input = connection.inputPorts.first?.input as? AVCaptureDeviceInput,
        let dims = HybridCameraFrameOutput.computeResizedBufferDimensions(
          activeFormat: input.device.activeFormat,
          connection: connection,
          target: options.targetResolution) {
        var settings = output.videoSettings ?? [:]
        settings[kCVPixelBufferWidthKey as String] = dims.width
        settings[kCVPixelBufferHeightKey as String] = dims.height
        output.videoSettings = settings
      }
    }
  }

  /// Computes a buffer size that satisfies `AVCaptureVideoDataOutput.videoSettings`'
  /// iOS 16+ constraints for `kCVPixelBufferWidthKey` / `kCVPixelBufferHeightKey`:
  ///   • matches the active format's aspect ratio exactly
  ///   • never exceeds the active format's native dimensions (no upscaling)
  ///   • is expressed in output (post-rotation) coordinates, respecting
  ///     the connection's videoOrientation / videoRotationAngle
  /// The result is the size closest to `target` that satisfies all of the above.
  /// Returns `nil` if the active format has degenerate dimensions.
  private static func computeResizedBufferDimensions(
    activeFormat: AVCaptureDevice.Format,
    connection: AVCaptureConnection,
    target: Size
  ) -> (width: Int, height: Int)? {
    let dims = CMVideoFormatDescriptionGetDimensions(activeFormat.formatDescription)
    let activeLong = Int(max(dims.width, dims.height))
    let activeShort = Int(min(dims.width, dims.height))
    guard activeLong > 0, activeShort > 0 else { return nil }

    // Work in orientation-independent (long, short) space. The active format's aspect
    // is the only aspect iOS will accept, so we ignore the target's own aspect and
    // match the target's long side to the active's.
    let targetLong = max(Int(target.width), Int(target.height))
    let useLong = max(min(targetLong, activeLong), 2)
    let useShort = max(
      Int((Double(useLong) * Double(activeShort) / Double(activeLong)).rounded()), 2)

    // Project back onto (width, height) using the connection's orientation.
    let isPortrait: Bool
    if #available(iOS 17.0, *) {
      let angle = connection.videoRotationAngle
      isPortrait = abs(angle - 90).isLess(than: 0.5) || abs(angle - 270).isLess(than: 0.5)
    } else {
      isPortrait =
        connection.videoOrientation == .portrait
        || connection.videoOrientation == .portraitUpsideDown
    }
    if isPortrait {
      return (width: useShort, height: useLong)
    } else {
      return (width: useLong, height: useShort)
    }
  }

  private func videoSettingsForPixelFormat(_ targetPixelFormat: TargetVideoPixelFormat) -> [String:
    Any]
  {
    let pixelFormat = targetPixelFormat.toCVPixelFormatType()
    switch pixelFormat {
    case .native:
      // Empty dictionary means "choose device-native format" (most efficient)
      return [:]
    case .specific(let format):
      // Use a specific format (e.g. 32 BGRA)
      return [
        kCVPixelBufferPixelFormatTypeKey as String: format
      ]
    }
  }

  private func getMediaSampleMetadata(
    at timestamp: CMTime,
    orientation bufferOrientation: CameraOrientation,
    isMirrored isBufferMirrored: Bool
  ) -> MediaSampleMetadata {
    // `isMirrored` is relative; if the buffer is already mirrored & we want mirror, good.
    // If not, we need to counter-mirror.
    var isMirrored: Bool
    switch self.mirrorMode {
    case .auto:
      // We just follow along with what the connection gives us.
      isMirrored = false
    case .on:
      // We enabled mirroring. If the buffer is not mirrored, we need to mirror.
      isMirrored = isBufferMirrored == false
    case .off:
      // We disabled mirroring. If the buffer is mirrored, we need to counter-mirror.
      isMirrored = isBufferMirrored == true
    }
    // `orientation` is relative to the target output orientation.
    let relativeOrientation = bufferOrientation.relativeTo(self.outputOrientation)

    return MediaSampleMetadata(
      timestamp: timestamp,
      orientation: relativeOrientation,
      isMirrored: isMirrored)
  }

  func setOnFrameCallback(onFrame: ((any HybridFrameSpec) -> Bool)?) throws {
    guard DispatchQueue.getSpecific(key: self.queueSpecificKey) != nil else {
      throw RuntimeError.error(
        withMessage: "setOnFrameCallback(...) must be called on the FrameOutput's `thread`!")
    }
    if let onFrame {
      delegate.onFrame = { (sampleBuffer, timestamp, bufferOrientation, isBufferMirrored) in
        // Prepare Frame + Metadata
        let metadata = self.getMediaSampleMetadata(
          at: timestamp,
          orientation: bufferOrientation,
          isMirrored: isBufferMirrored)
        let frame = HybridFrame(
          buffer: sampleBuffer,
          metadata: metadata)
        // Call sync JS function
        _ = onFrame(frame)
      }
    } else {
      delegate.onFrame = nil
    }
  }

  func setOnFrameDroppedCallback(onFrameDropped: ((FrameDroppedReason) -> Void)?) throws {
    if let onFrameDropped {
      delegate.onFrameDropped = { sampleBuffer in
        guard let attachment = sampleBuffer.attachments[.droppedFrameReason] else {
          return
        }
        let reason = FrameDroppedReason(sampleBufferReason: attachment)
        onFrameDropped(reason)
      }
    } else {
      delegate.onFrameDropped = nil
    }
  }
}
