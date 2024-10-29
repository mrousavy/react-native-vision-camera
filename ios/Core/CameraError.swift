//
//  CameraError.swift
//  mrousavy
//
//  Created by Marc Rousavy on 14.01.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import Foundation

// MARK: - PermissionError

enum PermissionError: String {
  case microphone = "microphone-permission-denied"
  case camera = "camera-permission-denied"
  case location = "location-permission-denied"

  var code: String {
    return rawValue
  }

  var message: String {
    switch self {
    case .microphone:
      return "The Microphone permission was denied! If you want to record Videos without sound, pass `audio={false}`."
    case .location:
      return "The Location permission was denied! If you want to capture photos or videos without location tags, pass `enableLocation={false}`."
    case .camera:
      return "The Camera permission was denied!"
    }
  }
}

// MARK: - ParameterError

enum ParameterError {
  case invalid(unionName: String, receivedValue: String)
  case unsupportedOutput(outputDescriptor: String)
  case unsupportedInput(inputDescriptor: String)
  case invalidCombination(provided: String, missing: String)

  var code: String {
    switch self {
    case .invalid:
      return "invalid-parameter"
    case .unsupportedOutput:
      return "unsupported-output"
    case .unsupportedInput:
      return "unsupported-input"
    case .invalidCombination:
      return "invalid-combination"
    }
  }

  var message: String {
    switch self {
    case let .invalid(unionName: unionName, receivedValue: receivedValue):
      return "The value \"\(receivedValue)\" could not be parsed to type \(unionName)!"
    case let .unsupportedOutput(outputDescriptor: output):
      return "The output \"\(output)\" is not supported!"
    case let .unsupportedInput(inputDescriptor: input):
      return "The input \"\(input)\" is not supported!"
    case let .invalidCombination(provided: provided, missing: missing):
      return "Invalid combination! If \"\(provided)\" is provided, \"\(missing)\" also has to be set!"
    }
  }
}

// MARK: - DeviceError

enum DeviceError {
  case configureError
  case noDevice
  case invalid
  case flashUnavailable
  case microphoneUnavailable
  case lowLightBoostNotSupported
  case focusNotSupported
  case notAvailableOnSimulator
  case pixelFormatNotSupported(targetFormats: [FourCharCode], availableFormats: [FourCharCode])

  var code: String {
    switch self {
    case .configureError:
      return "configuration-error"
    case .noDevice:
      return "no-device"
    case .invalid:
      return "invalid-device"
    case .flashUnavailable:
      return "flash-unavailable"
    case .microphoneUnavailable:
      return "microphone-unavailable"
    case .lowLightBoostNotSupported:
      return "low-light-boost-not-supported"
    case .focusNotSupported:
      return "focus-not-supported"
    case .notAvailableOnSimulator:
      return "camera-not-available-on-simulator"
    case .pixelFormatNotSupported:
      return "pixel-format-not-supported"
    }
  }

  var message: String {
    switch self {
    case .configureError:
      return "Failed to lock the device for configuration."
    case .noDevice:
      return "No device was set! Use `useCameraDevice(..)` or `Camera.getAvailableCameraDevices()` to select a suitable Camera device."
    case .invalid:
      return "The given Camera device was invalid. Use `useCameraDevice(..)` or `Camera.getAvailableCameraDevices()` to select a suitable Camera device."
    case .flashUnavailable:
      return "The Camera Device does not have a flash unit! Select a device where `device.hasFlash`/`device.hasTorch` is true."
    case .lowLightBoostNotSupported:
      return "The currently selected camera device does not support low-light boost! Select a device where `device.supportsLowLightBoost` is true."
    case .focusNotSupported:
      return "The currently selected camera device does not support focusing!"
    case .microphoneUnavailable:
      return "The microphone was unavailable."
    case .notAvailableOnSimulator:
      return "The Camera is not available on the iOS Simulator!"
    case let .pixelFormatNotSupported(targetFormats: targetFormats, availableFormats: availableFormats):
      let tried = targetFormats.map { $0.toString() }
      let found = availableFormats.map { $0.toString() }
      return "No compatible PixelFormat was found! VisionCamera will fallback to the default PixelFormat. " +
        "Try selecting a different format or disable videoHdr={..} and enableBufferCompression={..}. " +
        "Tried using one of these PixelFormats: \(tried), but the current format only supports these PixelFormats: \(found)"
    }
  }
}

// MARK: - FormatError

enum FormatError {
  case invalidFps(fps: Int)
  case invalidVideoHdr
  case invalidFormat
  case incompatiblePixelFormatWithHDR

  var code: String {
    switch self {
    case .invalidFormat:
      return "invalid-format"
    case .invalidFps:
      return "invalid-fps"
    case .invalidVideoHdr:
      return "invalid-video-hdr"
    case .incompatiblePixelFormatWithHDR:
      return "incompatible-pixel-format-with-hdr-setting"
    }
  }

  var message: String {
    switch self {
    case .invalidFormat:
      return "The given format was invalid. Did you check if the current device supports the given format in `device.formats`?"
    case let .invalidFps(fps):
      return "The given format cannot run at \(fps) FPS! Make sure your FPS is lower than `format.maxFps` but higher than `format.minFps`."
    case .invalidVideoHdr:
      return "The currently selected format does not support 10-bit Video HDR streaming! Make sure you select a format which includes `supportsVideoHdr`!"
    case .incompatiblePixelFormatWithHDR:
      return "The currently selected pixelFormat is not compatible with HDR! HDR only works with the `yuv` pixelFormat."
    }
  }
}

// MARK: - SessionError

enum SessionError {
  case cameraNotReady
  case audioSessionFailedToActivate
  case audioInUseByOtherApp
  case hardwareCostTooHigh(cost: Float)

  var code: String {
    switch self {
    case .cameraNotReady:
      return "camera-not-ready"
    case .audioInUseByOtherApp:
      return "audio-in-use-by-other-app"
    case .audioSessionFailedToActivate:
      return "audio-session-failed-to-activate"
    case .hardwareCostTooHigh:
      return "hardware-cost-too-high"
    }
  }

  var message: String {
    switch self {
    case .cameraNotReady:
      return "The Camera is not ready yet! Wait for the onInitialized() callback!"
    case .audioInUseByOtherApp:
      return "The audio session is already in use by another app with higher priority!"
    case .audioSessionFailedToActivate:
      return "Failed to activate Audio Session!"
    case let .hardwareCostTooHigh(cost: cost):
      return "The session's hardware-cost is too high! (Expected: <=1.0, Received: \(cost)) " +
        "See https://developer.apple.com/documentation/avfoundation/avcapturesession/3950869-hardwarecost " +
        "for more information."
    }
  }
}

// MARK: - CaptureError

enum CaptureError {
  case recordingInProgress
  case recordingCanceled
  case noRecordingInProgress
  case invalidPath(path: String)
  case fileError(cause: Error)
  case flashNotAvailable
  case imageDataAccessError
  case createTempFileError(message: String? = nil)
  case createRecorderError(message: String? = nil)
  case videoNotEnabled
  case photoNotEnabled
  case focusRequiresPreview
  case snapshotFailed
  case timedOut
  case insufficientStorage
  case failedWritingMetadata(cause: Error?)
  case unknown(message: String? = nil)

  var code: String {
    switch self {
    case .recordingInProgress:
      return "recording-in-progress"
    case .recordingCanceled:
      return "recording-canceled"
    case .noRecordingInProgress:
      return "no-recording-in-progress"
    case .fileError:
      return "file-io-error"
    case .createTempFileError:
      return "create-temp-file-error"
    case .invalidPath:
      return "invalid-path"
    case .flashNotAvailable:
      return "flash-not-available"
    case .createRecorderError:
      return "create-recorder-error"
    case .videoNotEnabled:
      return "video-not-enabled"
    case .imageDataAccessError:
      return "image-data-access-error"
    case .snapshotFailed:
      return "snapshot-failed"
    case .timedOut:
      return "timed-out"
    case .focusRequiresPreview:
      return "focus-requires-preview"
    case .photoNotEnabled:
      return "photo-not-enabled"
    case .insufficientStorage:
      return "insufficient-storage"
    case .failedWritingMetadata:
      return "failed-writing-metadata"
    case .unknown:
      return "unknown"
    }
  }

  var message: String {
    switch self {
    case .recordingInProgress:
      return "There is already an active video recording in progress! Did you call startRecording() twice?"
    case .recordingCanceled:
      return "The active recording was canceled."
    case .noRecordingInProgress:
      return "There was no active video recording in progress! Did you call stopRecording() twice?"
    case let .fileError(cause: cause):
      return "An unexpected File IO error occurred! Error: \(cause.localizedDescription)"
    case let .createTempFileError(message: message):
      return "Failed to create a temporary file! \(message ?? "(no additional message)")"
    case let .createRecorderError(message: message):
      return "Failed to create the AVAssetWriter (Recorder)! \(message ?? "(no additional message)")"
    case .videoNotEnabled:
      return "Video capture is disabled! Pass `video={true}` to enable video recordings."
    case let .invalidPath(path: path):
      return "The given path (\(path)) is invalid, or not writable!"
    case .snapshotFailed:
      return "Failed to take a Snapshot of the Preview View! Try using takePhoto() instead."
    case .photoNotEnabled:
      return "Photo capture is disabled! Pass `photo={true}` to enable photo capture."
    case .imageDataAccessError:
      return "An unexpected error occurred while trying to access the image data!"
    case .flashNotAvailable:
      return "The Camera Device does not have a flash unit! Make sure you select a device where `device.hasFlash`/`device.hasTorch` is true."
    case .timedOut:
      return "The capture timed out."
    case .focusRequiresPreview:
      return "Focus requires preview={...} to be enabled!"
    case let .failedWritingMetadata(cause: cause):
      return "Failed to write video/photo metadata! (Cause: \(cause?.localizedDescription ?? "unknown"))"
    case .insufficientStorage:
      return "There is not enough storage space available."
    case let .unknown(message: message):
      return message ?? "An unknown error occured while capturing a video/photo."
    }
  }
}

// MARK: - CodeScannerError

enum CodeScannerError {
  case notCompatibleWithOutputs
  case codeTypeNotSupported(codeType: String)

  var code: String {
    switch self {
    case .notCompatibleWithOutputs:
      return "not-compatible-with-outputs"
    case .codeTypeNotSupported:
      return "code-type-not-supported"
    }
  }

  var message: String {
    switch self {
    case .notCompatibleWithOutputs:
      return "The Code Scanner is not supported in combination with the current outputs! Either disable video or photo outputs."
    case let .codeTypeNotSupported(codeType: codeType):
      return "The codeType \"\(codeType)\" is not supported by the Code Scanner!"
    }
  }
}

// MARK: - SystemError

enum SystemError {
  case locationNotEnabled

  var code: String {
    switch self {
    case .locationNotEnabled:
      return "location-not-enabled"
    }
  }

  var message: String {
    switch self {
    case .locationNotEnabled:
      return "Location is not enabled, so VisionCamera did not compile the Location APIs. " +
        "Set $VCEnableLocation in your Podfile, or enableLocation in the expo config plugin and rebuild."
    }
  }
}

// MARK: - CameraError

enum CameraError: Error {
  case permission(_ id: PermissionError)
  case parameter(_ id: ParameterError)
  case device(_ id: DeviceError)
  case format(_ id: FormatError)
  case session(_ id: SessionError)
  case capture(_ id: CaptureError)
  case codeScanner(_ id: CodeScannerError)
  case system(_ id: SystemError)
  case unknown(message: String? = nil, cause: NSError? = nil)

  var code: String {
    switch self {
    case let .permission(id: id):
      return "permission/\(id.code)"
    case let .parameter(id: id):
      return "parameter/\(id.code)"
    case let .device(id: id):
      return "device/\(id.code)"
    case let .format(id: id):
      return "format/\(id.code)"
    case let .session(id: id):
      return "session/\(id.code)"
    case let .capture(id: id):
      return "capture/\(id.code)"
    case let .codeScanner(id: id):
      return "code-scanner/\(id.code)"
    case let .system(id: id):
      return "system/\(id.code)"
    case .unknown:
      return "unknown/unknown"
    }
  }

  var message: String {
    switch self {
    case let .permission(id: id):
      return id.message
    case let .parameter(id: id):
      return id.message
    case let .device(id: id):
      return id.message
    case let .format(id: id):
      return id.message
    case let .session(id: id):
      return id.message
    case let .capture(id: id):
      return id.message
    case let .codeScanner(id: id):
      return id.message
    case let .system(id: id):
      return id.message
    case let .unknown(message: message, cause: cause):
      return message ?? cause?.description ?? "An unexpected error occured."
    }
  }

  var cause: NSError? {
    switch self {
    case let .unknown(message: _, cause: cause):
      return cause
    default:
      return nil
    }
  }
}
