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

  var code: String {
    return rawValue
  }

  var message: String {
    switch self {
    case .microphone:
      return "The Microphone permission was denied! If you want to record Videos without sound, pass `audio={false}`."
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

enum DeviceError: String {
  case configureError = "configuration-error"
  case noDevice = "no-device"
  case invalid = "invalid-device"
  case flashUnavailable = "flash-unavailable"
  case microphoneUnavailable = "microphone-unavailable"
  case lowLightBoostNotSupported = "low-light-boost-not-supported"
  case focusNotSupported = "focus-not-supported"
  case notAvailableOnSimulator = "camera-not-available-on-simulator"
  case pixelFormatNotSupported = "pixel-format-not-supported"

  var code: String {
    return rawValue
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
    case .pixelFormatNotSupported:
      return "The given pixelFormat is not supported on the given Camera Device!"
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

  var code: String {
    switch self {
    case .cameraNotReady:
      return "camera-not-ready"
    case .audioInUseByOtherApp:
      return "audio-in-use-by-other-app"
    case .audioSessionFailedToActivate:
      return "audio-session-failed-to-activate"
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
    }
  }
}

// MARK: - CaptureError

enum CaptureError {
  case recordingInProgress
  case noRecordingInProgress
  case fileError
  case createTempFileError(message: String? = nil)
  case createRecorderError(message: String? = nil)
  case videoNotEnabled
  case photoNotEnabled
  case aborted
  case insufficientStorage
  case unknown(message: String? = nil)

  var code: String {
    switch self {
    case .recordingInProgress:
      return "recording-in-progress"
    case .noRecordingInProgress:
      return "no-recording-in-progress"
    case .fileError:
      return "file-io-error"
    case .createTempFileError:
      return "create-temp-file-error"
    case .createRecorderError:
      return "create-recorder-error"
    case .videoNotEnabled:
      return "video-not-enabled"
    case .photoNotEnabled:
      return "photo-not-enabled"
    case .insufficientStorage:
      return "insufficient-storage"
    case .aborted:
      return "aborted"
    case .unknown:
      return "unknown"
    }
  }

  var message: String {
    switch self {
    case .recordingInProgress:
      return "There is already an active video recording in progress! Did you call startRecording() twice?"
    case .noRecordingInProgress:
      return "There was no active video recording in progress! Did you call stopRecording() twice?"
    case .fileError:
      return "An unexpected File IO error occured!"
    case let .createTempFileError(message: message):
      return "Failed to create a temporary file! \(message ?? "(no additional message)")"
    case let .createRecorderError(message: message):
      return "Failed to create the AVAssetWriter (Recorder)! \(message ?? "(no additional message)")"
    case .videoNotEnabled:
      return "Video capture is disabled! Pass `video={true}` to enable video recordings."
    case .photoNotEnabled:
      return "Photo capture is disabled! Pass `photo={true}` to enable photo capture."
    case .aborted:
      return "The capture has been stopped before any input data arrived."
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

// MARK: - CameraError

enum CameraError: Error {
  case permission(_ id: PermissionError)
  case parameter(_ id: ParameterError)
  case device(_ id: DeviceError)
  case format(_ id: FormatError)
  case session(_ id: SessionError)
  case capture(_ id: CaptureError)
  case codeScanner(_ id: CodeScannerError)
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
