//
//  HybridTextRecognitionOutput.swift
//  VisionCameraTextRecognition
//

import AVFoundation
import MLKitTextRecognition
import MLKitVision
import NitroModules
import VisionCamera

final class HybridTextRecognitionOutput: HybridCameraOutputSpec, NativeCameraOutput {
  private let recognizer: TextRecognizer
  private let onTextRecognized: (_ result: RecognizedText) -> Void
  private let onError: (_ error: Error) -> Void
  private var delegate: TextRecognitionDelegate? = nil
  private let queue: DispatchQueue
  let output: AVCaptureVideoDataOutput
  let requiresAudioInput: Bool = false
  let requiresDepthFormat: Bool = false
  let mediaType: MediaType = .video
  var outputOrientation: CameraOrientation = .up
  var currentResolution: Size? {
    guard let connection = output.connection(with: .video) else { return nil }
    return connection.inputStreamResolution
  }

  let streamType: StreamType = .video
  var targetResolution: ResolutionRule {
    // TODO: Is this a good size for ML? Lower? Higher?
    //       Maybe a good point to refactor the resolution/format
    //       negotiation in the Constraint system - not sure if all
    //       CameraOutputs should participate in negotiating sizes?
    return .closestTo(Size(width: 720.0, height: 1280.0))
  }

  init(options: TextRecognitionOutputOptions) {
    self.recognizer = TextRecognizer.textRecognizer(options: TextRecognizerOptions())
    self.onTextRecognized = options.onTextRecognized
    self.onError = options.onError
    self.queue = DispatchQueue(label: "com.margelo.camera.textrecognition")
    self.output = AVCaptureVideoDataOutput()
    super.init()

    // set delegate
    self.delegate = TextRecognitionDelegate(onSampleBuffer: {
      [weak self] buffer, cameraPosition in
      self?.recognize(buffer, cameraPosition: cameraPosition)
    })
    self.output.setSampleBufferDelegate(delegate, queue: queue)
    self.output.alwaysDiscardsLateVideoFrames = true
    if #available(iOS 17.0, *), options.outputResolution != .full {
      self.output.automaticallyConfiguresOutputBufferDimensions = false
      self.output.deliversPreviewSizedOutputBuffers = true
    }
  }

  private func recognize(
    _ buffer: CMSampleBuffer,
    cameraPosition: AVCaptureDevice.Position
  ) {
    // prepare MLImage
    guard let image = MLImage(sampleBuffer: buffer) else {
      onError(RuntimeError.error(withMessage: "Failed to convert CMSampleBuffer to MLImage!"))
      return
    }
    image.orientation = imageOrientation(cameraPosition: cameraPosition)

    // start recognizing
    do {
      let text = try recognizer.results(in: image)
      onTextRecognized(text.toRecognizedText())
    } catch {
      onError(error)
    }
  }

  func configure(config: CameraOutputConfiguration) {
    guard let connection = self.output.connection(with: .video) else {
      return
    }
    connection.preferredVideoStabilizationMode = .off
  }

  private func imageOrientation(cameraPosition: AVCaptureDevice.Position) -> UIImage.Orientation {
    let isFrontCamera = cameraPosition == .front
    switch outputOrientation {
    case .up:
      return isFrontCamera ? .leftMirrored : .right
    case .right:
      return isFrontCamera ? .upMirrored : .down
    case .down:
      return isFrontCamera ? .rightMirrored : .left
    case .left:
      return isFrontCamera ? .downMirrored : .up
    }
  }
}
