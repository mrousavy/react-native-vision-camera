//
// CameraView+Orientation.swift
// VisionCamera
//
// Created by Marc Rousavy on 04.01.22.
// Copyright © 2022 mrousavy. All rights reserved.
//
import Foundation
import UIKit
import AVFoundation
extension CameraView {
 private func interfaceOrientation(from: UIDeviceOrientation) -> UIInterfaceOrientation {
  switch (from) {
   case .landscapeLeft:
    return .landscapeRight
   case .landscapeRight:
    return .landscapeLeft
   case .portraitUpsideDown:
    return .portraitUpsideDown
   default:
    return .portrait
  }
 }
 private func captureVideoOrientation(from: UIInterfaceOrientation) -> AVCaptureVideoOrientation {
  switch (from) {
   case .landscapeLeft:
    return .landscapeLeft
   case .landscapeRight:
    return .landscapeRight
   case .portraitUpsideDown:
    return .portraitUpsideDown
   default:
    return .portrait
  }
 }
 // Orientation of the input connection (preview)
 private var inputOrientation: UIInterfaceOrientation {
  return self.interfaceOrientation(from: UIDevice.current.orientation)
 }
 // Orientation of the output connections (photo, video, frame processor)
 private var outputOrientation: UIInterfaceOrientation {
   return inputOrientation
 }
 internal func updateOrientation() {
  // Updates the Orientation for all rotable
  let isMirrored = cameraSession.videoDeviceInput?.device.position == .front
  let connectionOrientation = self.outputOrientation
   cameraSession.captureSession.outputs.forEach { output in
   output.connections.forEach { connection in
    if connection.isVideoMirroringSupported {
     connection.automaticallyAdjustsVideoMirroring = false
     connection.isVideoMirrored = isMirrored
    }
    connection.setInterfaceOrientation(connectionOrientation)
   }
  }
  // update the preview layer orientation when the user rotates the device
  // adapted from https://stackoverflow.com/a/36575423
  DispatchQueue.main.async {
    if let previewLayerConnection: AVCaptureConnection = self.previewView.videoPreviewLayer.connection {
    if previewLayerConnection.isVideoOrientationSupported {
     previewLayerConnection.videoOrientation = self.captureVideoOrientation(from: connectionOrientation)
      self.previewView.frame = self.bounds
    }
   }
  }
 }
}