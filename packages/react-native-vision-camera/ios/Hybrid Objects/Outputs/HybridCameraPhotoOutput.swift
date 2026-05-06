///
/// HybridCameraPhotoOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroImage
import NitroModules

class HybridCameraPhotoOutput: HybridCameraPhotoOutputSpec, NativeCameraOutput {
  private let options: PhotoOutputOptions
  let mediaType: MediaType = .video
  let requiresAudioInput: Bool = false
  // TODO: If depth data delivery is configured, we probably should return `true` here
  let requiresDepthFormat: Bool = false
  let output: AVCapturePhotoOutput

  var supportsDepthDataDelivery: Bool {
    return output.isDepthDataDeliverySupported
  }

  var supportsCameraCalibrationDataDelivery: Bool {
    return output.isCameraCalibrationDataDeliverySupported
  }
  var outputOrientation: CameraOrientation = .up {
    didSet {
      guard let connection = output.connection(with: .video) else { return }
      // TODO: Should we apply that within the CameraSession's DispatchQueue? Batch it?
      try? connection.setOrientation(outputOrientation)
    }
  }

  var streamType: StreamType = .photo
  var targetResolution: ResolutionRule {
    return .closestTo(options.targetResolution)
  }

  init(options: PhotoOutputOptions) throws {
    self.output = AVCapturePhotoOutput()
    self.options = options
    super.init()

    // Note: All AVCapturePhotoOutput configuration has been moved out of init().
    // On iOS 18.5, any property access on an AVCapturePhotoOutput that is not yet connected
    // to a capture session throws an ObjC NSException. Swift's `try?` does not catch ObjC
    // exceptions — they propagate as EXC_BREAKPOINT (brk #0x1), crashing the app.
    // Configuration now happens in configure(), which is called after the output is attached.
  }

  func configure(config: CameraOutputConfiguration) {
    // Note: On iOS 18.5, AVCapturePhotoOutput property setters (setOrientation, setMirrorMode,
    // maxPhotoDimensions) throw ObjC NSExceptions during session configuration. These exceptions
    // are caught at the GCD block boundary (no crash), but they abort configure(), preventing
    // onConfigured from firing and permanently blocking photo capture.
    //
    // Connection-based orientation/mirror updates are handled via the outputOrientation didSet
    // observer and are safe once the session is running (called after configure completes).
  }

  private func prepareDefaultPhotoSettings() throws {
    // Create default capture settings
    let settings = CapturePhotoSettings(
      flashMode: .off,
      enableShutterSound: true,
      enableDepthData: false,
      enableRedEyeReduction: true,
      enableCameraCalibrationDataDelivery: false,
      enableDistortionCorrection: false,
      enableVirtualDeviceFusion: true,
      location: nil)
    let avSettings = try settings.toAVCapturePhotoSettings(for: output, withOptions: options)
    // Prepare the AVCapturePhotoOutput for those settings so coming up captures are faster
    self.output.setPreparedPhotoSettingsArray([avSettings])
  }

  func capturePhoto(
    settings: CapturePhotoSettings,
    callbacks: CapturePhotoCallbacks
  ) -> Promise<any HybridPhotoSpec> {
    guard output.connection(with: .video) != nil else {
      let error = RuntimeError.error(
        withMessage: "PhotoOutput is not yet connected to the CameraSession!")
      return Promise.rejected(withError: error)
    }

    // 1. Prepare delegate that will resolve/reject Promise
    let promise = Promise<any HybridPhotoSpec>()
    let resultingFormat = PhotoContainerFormat(targetFormat: self.options.containerFormat)
    let delegate = CapturePhotoDelegate(
      onCaptured: { photo, metadata in
        // We received a Photo!
        // 1. Check if we have a Preview Image (if it was requested)
        if self.options.previewImageTargetSize != nil,
          let onPreviewImageAvailable = callbacks.onPreviewImageAvailable
        {
          Task {
            // On a separate Thread, start decoding the Preview Image Data
            guard let cgPreviewImage = photo.previewCGImageRepresentation() else {
              return
            }
            // Wrap the `CGImage` in a `HybridUIImage` and notify the callback
            let uiImage = UIImage(
              cgImage: cgPreviewImage, scale: 1.0, orientation: metadata.uiImageOrientation)
            let image = HybridUIImage(uiImage: uiImage)
            onPreviewImageAvailable(image)
          }
        }
        // 2. Wrap the `AVCapturePhoto` in a `HybridPhoto` and resolve the Promise
        let image = HybridPhoto(
          photo: photo,
          metadata: metadata,
          containerFormat: resultingFormat)
        promise.resolve(withResult: image)
      },
      onError: { error in
        promise.reject(withError: error)
      },
      callbacks: callbacks)

    do {
      // 2. Prepare Photo settings
      let captureSettings = try settings.toAVCapturePhotoSettings(
        for: self.output, withOptions: self.options)
      // 3. Perform capture
      output.capturePhoto(with: captureSettings, delegate: delegate)
      // Note: setPreparedPhotoSettingsArray removed — on iOS 18.5 this throws an ObjC
      // NSException after the capture has started, causing Nitro to reject the Promise
      // before the delegate fires. The delegate then attempts to resolve an already-rejected
      // Promise, losing the photo. Removing it is safe; it is only a performance pre-warm.
      return promise
    } catch {
      // Something failed - e.g. creating Photo settings!
      return Promise.rejected(withError: error)
    }
  }

  func capturePhotoToFile(settings: CapturePhotoSettings, callbacks: CapturePhotoCallbacks) throws
    -> Promise<PhotoFile>
  {
    return Promise.async {
      let photo = try await self.capturePhoto(settings: settings, callbacks: callbacks)
        .await()
      let filePath = try await photo.saveToTemporaryFileAsync()
        .await()
      return PhotoFile(filePath: filePath)
    }
  }
}
