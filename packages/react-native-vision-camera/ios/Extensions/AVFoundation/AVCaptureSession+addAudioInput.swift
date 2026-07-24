///
/// AVCaptureSession+addAudioInput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureSession {
  func addAudioInput() throws {
    guard let microphone = AVCaptureDevice.default(for: .audio) else {
      throw RuntimeError.error(withMessage: "This device does not have a microphone!")
    }
    let input = try AVCaptureDeviceInput(device: microphone)
    logger.info("Adding microphone \(input)...")
    self.addInputWithNoConnections(input)
  }
  func addAudioConnection(to output: AVCaptureOutput) throws {
    guard let audioDevice = self.inputs.first(where: { $0.isMicrophone }) else {
      throw RuntimeError.error(
        withMessage:
          "Tried to form a Connection between the Audio Device and Output \(output), but no Audio Device is attached to this CameraSession!"
      )
    }
    guard let audioPort = audioDevice.ports.first(where: { $0.mediaType == .audio }) else {
      throw RuntimeError.error(withMessage: "Audio Device does not have an audio port!")
    }
    let connection = AVCaptureConnection(
      inputPorts: [audioPort],
      output: output)
    guard self.canAddConnection(connection) else {
      throw RuntimeError.error(
        withMessage: "Audio Connection \"\(connection)\" cannot be added to Camera Session!")
    }
    self.addConnection(connection)
  }
}
