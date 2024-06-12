//
//  AVCaptureOutput+orientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 04.06.24.
//

import AVFoundation
import Foundation

extension AVCaptureConnection {
  func getOrientation(device: AVCaptureDevice) -> Orientation {
    if #available(iOS 17.0, *) {
      let degrees = (videoRotationAngle - device.sensorOrientation.degrees + 360).truncatingRemainder(dividingBy: 360)
      return Orientation(degrees: degrees)
    } else {
      return Orientation(videoOrientation: videoOrientation)
    }
  }

  func setOrientation(newOrientation: Orientation, device: AVCaptureDevice) {
    if #available(iOS 17.0, *) {
      let degrees = (newOrientation.degrees + device.sensorOrientation.degrees + 360).truncatingRemainder(dividingBy: 360)
      if isVideoRotationAngleSupported(degrees) {
        videoRotationAngle = degrees
      }
    } else {
      if isVideoOrientationSupported {
        videoOrientation = newOrientation.videoOrientation
      }
    }
  }
}
