//
//  HybridCameraCalibrationData.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.10.25.
//

import Foundation
import AVFoundation
import NitroModules

class HybridCameraCalibrationData: HybridCameraCalibrationDataSpec {
  let calibrationData: AVCameraCalibrationData

  init(calibrationData: AVCameraCalibrationData) {
    self.calibrationData = calibrationData
    super.init()
  }
  
  var pixelSize: Double {
    return Double(calibrationData.pixelSize)
  }
  
  var intrinsicMatrixReferenceDimensions: Size {
    let cgSize = calibrationData.intrinsicMatrixReferenceDimensions
    return Size(cgSize)
  }
  
  var lensDistortionCenter: Point {
    let cgPoint = calibrationData.lensDistortionCenter
    return Point(cgPoint)
  }
}
