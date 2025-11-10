//
//  HybridDepth.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.10.25.
//

import Foundation
import AVFoundation
import NitroModules
import NitroImage

class HybridDepth: HybridDepthSpec, NativeDepth, LazyLockableBuffer {
  var depthData: AVDepthData?
  let metadata: MediaSampleMetadata
  var isLocked: Bool = false
  var pixelBuffer: CVPixelBuffer? {
    return depthData?.depthDataMap
  }
  
  init(depthData: AVDepthData,
       metadata: MediaSampleMetadata) {
    self.depthData = depthData
    self.metadata = metadata
    super.init()
  }
  
  func dispose() {
    unlockBuffer()
    depthData = nil
  }
  
  var isValid: Bool {
    return depthData != nil
  }
  
  var width: Double {
    guard let pixelBuffer else {
      return 0
    }
    return Double(CVPixelBufferGetWidth(pixelBuffer))
  }
  var height: Double {
    guard let pixelBuffer else {
      return 0
    }
    return Double(CVPixelBufferGetHeight(pixelBuffer))
  }
  
  var timestamp: Double {
    return metadata.timestamp.seconds
  }
  var orientation: Orientation {
    return metadata.orientation
  }
  var isMirrored: Bool {
    return metadata.isMirrored
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
                       metadata: metadata)
  }
  
  func rotateAsync(orientation: Orientation, isMirrored: Bool) throws -> Promise<any HybridDepthSpec> {
    return Promise.async {
      return try self.rotate(orientation: orientation, isMirrored: isMirrored)
    }
  }
  
  func convert(pixelFormat: DepthPixelFormat) throws -> any HybridDepthSpec {
    guard let depthData else {
      throw RuntimeError.error(withMessage: "Tried to convert an already disposed Depth!")
    }
    let osFormat = try pixelFormat.toCVPixelFormatType()
    let converted = depthData.converting(toDepthDataType: osFormat)
    return HybridDepth(depthData: converted,
                       metadata: metadata)
  }
  
  func convertAsync(pixelFormat: DepthPixelFormat) throws -> Promise<any HybridDepthSpec> {
    return Promise.async {
      return try self.convert(pixelFormat: pixelFormat)
    }
  }
  
  func getDepthData() throws -> ArrayBuffer {
    guard let depthData else {
      throw RuntimeError.error(withMessage: "Cannot get an already disposed Depth Frame's data!")
    }
    try ensureBufferLocked()
    return try ArrayBuffer.fromPixelBuffer(depthData.depthDataMap)
  }
  
  func toFrame() throws -> any HybridFrameSpec {
    guard let depthData else {
      throw RuntimeError.error(withMessage: "Cannot convert an already disposed Depth to a Frame!")
    }
    let format = try CMFormatDescription(imageBuffer: depthData.depthDataMap)
    let timing = CMSampleTimingInfo(duration: .zero,
                                    presentationTimeStamp: metadata.timestamp,
                                    decodeTimeStamp: .zero)
    let sampleBuffer = try CMSampleBuffer(imageBuffer: depthData.depthDataMap,
                                          formatDescription: format,
                                          sampleTiming: timing)
    return HybridFrame(buffer: sampleBuffer,
                       metadata: metadata)
  }
  func toFrameAsync() -> Promise<any HybridFrameSpec> {
    return Promise.async {
      return try self.toFrame()
    }
  }
  
  func toImage() throws -> any HybridImageSpec {
    guard let depthData else {
      throw RuntimeError.error(withMessage: "Cannot convert an already disposed Depth to an Image!")
    }
    let uiOrientation = orientation.toUIImageOrientation(isMirrored: isMirrored)
    let uiImage = try depthData.toUIImage(orientation: uiOrientation)
    return HybridUIImage(uiImage: uiImage)
  }
  
  func toImageAsync() throws -> Promise<any HybridImageSpec> {
    return Promise.async {
      return try self.toImage()
    }
  }
  
  func toDictionary(type: AuxilaryDepthType) throws -> AnyMap {
    guard let depthData else {
      throw RuntimeError.error(withMessage: "Cannot convert already disposed Depth Frame to Dictionary!")
    }
    guard let dictionary = depthData.dictionaryRepresentation(forAuxiliaryDataType: nil) else {
      throw RuntimeError.error(withMessage: "Failed to convert Depth Frame to Dictionary!")
    }
    // [AnyHashable: Any] -> [String: Any] (drop all unsupported)
    var stringDictionary: [String: Any] = [:]
    for (key, value) in dictionary {
      if let stringKey = key as? String {
        stringDictionary[stringKey] = value
      } else {
        print("Depth Key \"\(key)\" cannot be converted to JS!")
      }
    }
    // [String: Any] -> AnyMap
    return AnyMap.fromDictionaryIgnoreIncompatible(stringDictionary)
  }
  
  func toDictionaryAsync(type: AuxilaryDepthType) throws -> Promise<AnyMap> {
    return Promise.async {
      return try self.toDictionary(type: type)
    }
  }
}
