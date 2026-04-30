///
/// AVCaptureDevice.Format+supportsOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation

extension AVCaptureDevice.Format {
  func supportsOutput(_ output: AVCaptureOutput) -> Bool {
    #if targetEnvironment(simulator)
    // SimCam's DummyCaptureDeviceFormat doesn't implement isStreamingDisparitySupported,
    // which is called internally by unsupportedCaptureOutputClasses, causing a SIGSEGV
    // on the com.margelo.camera.session queue. On simulator all outputs are assumed
    // supported since we're using a fake camera anyway.
    return true
    #else
    let targetOutputClass = type(of: output)
    return self.unsupportedCaptureOutputClasses.allSatisfy { $0 != targetOutputClass }
    #endif
  }
}
