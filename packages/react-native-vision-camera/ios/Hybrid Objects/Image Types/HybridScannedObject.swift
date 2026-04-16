//
//  HybridScannedObject.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.10.25.
//

import AVFoundation
import Foundation
import NitroImage
import NitroModules

final class HybridScannedObject: HybridScannedObjectSpec, NativeScannedObject {
  let object: AVMetadataObject
  init(object: AVMetadataObject) {
    self.object = object
  }
  var type: ScannedObjectType {
    return ScannedObjectType(type: object.type)
  }
  var boundingBox: BoundingBox {
    return BoundingBox(object.bounds)
  }
}

final class HybridScannedCode: HybridScannedCodeSpec, NativeScannedObject {
  let object: AVMetadataMachineReadableCodeObject
  init(object: AVMetadataMachineReadableCodeObject) {
    self.object = object
  }
  var type: ScannedObjectType {
    return ScannedObjectType(type: object.type)
  }
  var boundingBox: BoundingBox {
    return BoundingBox(object.bounds)
  }
  var value: String? {
    return object.stringValue
  }
  var cornerPoints: [Point] {
    return object.corners.map { Point($0) }
  }
}

final class HybridScannedFace: HybridScannedFaceSpec, NativeScannedObject {
  let object: AVMetadataFaceObject
  init(object: AVMetadataFaceObject) {
    self.object = object
  }
  var type: ScannedObjectType {
    return ScannedObjectType(type: object.type)
  }
  var boundingBox: BoundingBox {
    return BoundingBox(object.bounds)
  }
  var faceID: Double {
    return Double(object.faceID)
  }
  var hasRollAngle: Bool {
    return object.hasRollAngle
  }
  var rollAngle: Double {
    return Double(object.rollAngle)
  }
  var hasYawAngle: Bool {
    return object.hasYawAngle
  }
  var yawAngle: Double {
    return Double(object.yawAngle)
  }
}
