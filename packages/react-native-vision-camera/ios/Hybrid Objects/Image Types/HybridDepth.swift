//
//  HybridDepth.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.10.25.
//

import Foundation
import AVFoundation
import NitroModules

class HybridDepth: HybridDepthSpec, NativeDepth {
  var depthData: AVDepthData?
  let depthTimestamp: CMTime
  let orientation: Orientation
  
  init(depthData: AVDepthData, timestamp: CMTime, orientation: Orientation) {
    self.depthData = depthData
    self.depthTimestamp = timestamp
    self.orientation = orientation
    super.init()
  }
  
  func dispose() {
    depthData = nil
  }
  
  var isValid: Bool {
    return depthData != nil
  }
  
  var timestamp: Double {
    return depthTimestamp.seconds
  }
  
  var pixelFormat: DepthPixelFormat {
    guard let depthData else {
      return .unknown
    }
    return DepthPixelFormat(osType: depthData.depthDataType)
  }
  
  var isDepthDataFiltered: Bool {
    return depthData?.isDepthDataFiltered ?? false
  }
  
  var depthDataAccuracy: DepthDataAccuracy {
    guard let depthData else {
      return .unknown
    }
    return DepthDataAccuracy(av: depthData.depthDataAccuracy)
  }
  
  var depthDataQuality: DepthDataQuality {
    guard let depthData else {
      return .unknown
    }
    return DepthDataQuality(av: depthData.depthDataQuality)
  }
  
  var availableDepthPixelFormats: [DepthPixelFormat] {
    guard let depthData else {
      return []
    }
    return depthData.availableDepthDataTypes.map { DepthPixelFormat(osType: $0) }
  }
  
  var cameraCalibrationData: (any HybridCameraCalibrationDataSpec)? {
    guard let depthData,
          let calibrationData = depthData.cameraCalibrationData else {
      return nil
    }
    return HybridCameraCalibrationData(calibrationData: calibrationData)
  }
  
  func rotate(orientation: Orientation, isMirrored: Bool) throws -> any HybridDepthSpec {
    guard let depthData else {
      throw RuntimeError.error(withMessage: "Tried to rotate an already disposed Depth!")
    }
    let cgOrientation = orientation.toCGOrientation(isMirrored: isMirrored)
    let rotated = depthData.applyingExifOrientation(cgOrientation)
    return HybridDepth(depthData: rotated,
                       timestamp: self.depthTimestamp,
                       orientation: self.orientation)
  }
  
  func rotateAsync(orientation: Orientation, isMirrored: Bool) throws -> Promise<any HybridDepthSpec> {
    return Promise.async {
      return try self.rotate(orientation: orientation, isMirrored: isMirrored)
    }
  }
  
  func convert(pixelFormat: DepthPixelFormat) throws -> any HybridDepthSpec {
    guard let depthData else {
      throw RuntimeError.error(withMessage: "Tried to rotate an already disposed Depth!")
    }
    let osFormat = try pixelFormat.toOSType()
    let converted = depthData.converting(toDepthDataType: osFormat)
    return HybridDepth(depthData: converted,
                       timestamp: self.depthTimestamp,
                       orientation: self.orientation)
  }
  
  func convertAsync(pixelFormat: DepthPixelFormat) throws -> Promise<any HybridDepthSpec> {
    return Promise.async {
      return try self.convert(pixelFormat: pixelFormat)
    }
  }
  
  func toImage() throws -> any HybridImageSpec {
    <#code#>
  }
  
  func toImageAsync() throws -> Promise<any HybridImageSpec> {
    <#code#>
  }
  
  func toDictionary(type: AuxilaryDepthType) throws -> AnyMap {
    <#code#>
  }
  
  func toDictionaryAsync(type: AuxilaryDepthType) throws -> Promise<AnyMap> {
    <#code#>
  }
}
