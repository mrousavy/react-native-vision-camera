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
  let timestamp: Double
  let orientation: Orientation
  
  init(depthData: AVDepthData, timestamp: CMTime, orientation: Orientation) {
    self.depthData = depthData
    self.timestamp = timestamp.seconds
    self.orientation = orientation
    super.init()
  }
  
  func dispose() {
    depthData = nil
  }
  
  var pixelFormat: DepthPixelFormat {
    guard let depthData else {
      fatalError("TODO: Handle null here")
    }
 depthData.depthDataType
  }
  
  var isDepthDataFiltered: Bool
  
  var depthDataAccuracy: DepthDataAccuracy
  
  var depthDataQuality: DepthDataQuality
  
  var availableDepthPixelFormats: [DepthPixelFormat]
  
  var cameraCalibrationData: (any HybridCameraCalibrationDataSpec)?
  
  func rotate(orientation: Orientation, isMirrored: Bool) throws -> any HybridDepthSpec {
    <#code#>
  }
  
  func rotateAsync(orientation: Orientation, isMirrored: Bool) throws -> NitroModules.Promise<any HybridDepthSpec> {
    <#code#>
  }
  
  func convert(pixelFormat: DepthPixelFormat) throws -> any HybridDepthSpec {
    <#code#>
  }
  
  func convertAsync(pixelFormat: DepthPixelFormat) throws -> NitroModules.Promise<any HybridDepthSpec> {
    <#code#>
  }
  
  func toImage() throws -> any NitroImage.HybridImageSpec {
    <#code#>
  }
  
  func toImageAsync() throws -> NitroModules.Promise<any NitroImage.HybridImageSpec> {
    <#code#>
  }
  
  func toDictionary(type: AuxilaryDepthType) throws -> NitroModules.AnyMap {
    <#code#>
  }
  
  func toDictionaryAsync(type: AuxilaryDepthType) throws -> NitroModules.Promise<NitroModules.AnyMap> {
    <#code#>
  }
}
