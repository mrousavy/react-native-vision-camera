//
//  CameraView+Torch.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 20.07.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension CameraView {
  final func setTorchMode(_ torchMode: String) {
    guard let device = videoDeviceInput?.device else {
      invokeOnError(.session(.cameraNotReady))
      return
    }
    guard var torchMode = AVCaptureDevice.TorchMode(withString: torchMode) else {
      invokeOnError(.parameter(.invalid(unionName: "TorchMode", receivedValue: torch)))
      return
    }
    if !captureSession.isRunning {
      torchMode = .off
    }
    if device.torchMode == torchMode {
      // no need to run the whole lock/unlock bs
      return
    }
    if !device.hasTorch || !device.isTorchAvailable {
      if torchMode == .off {
        // ignore it, when it's off and not supported, it's off.
        return
      } else {
        // torch mode is .auto or .on, but no torch is available.
        invokeOnError(.device(.flashUnavailable))
        return
      }
    }
    do {
      try device.lockForConfiguration()
      device.torchMode = torchMode
      if torchMode == .on {
        try device.setTorchModeOn(level: 1.0)
      }
      device.unlockForConfiguration()
    } catch let error as NSError {
      invokeOnError(.device(.configureError), cause: error)
      return
    }
  }
}
