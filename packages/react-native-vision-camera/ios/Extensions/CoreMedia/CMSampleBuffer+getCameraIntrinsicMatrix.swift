//
//  CMSampleBuffer+getCameraIntrinsicMatrix.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 23.01.26.
//

import AVFoundation

extension CMSampleBuffer {
  func getCameraIntrinsicMatrix() -> simd_float3x3? {
    guard let matrixAttachment = self.attachments[.cameraIntrinsicMatrix],
      let matrixData = matrixAttachment.value as? Data
    else {
      return nil
    }
    let matrix: simd_float3x3 = matrixData.withUnsafeBytes { buffer in
      precondition(buffer.count >= MemoryLayout<matrix_float3x3>.stride)
      return buffer.load(as: matrix_float3x3.self)
    }
    return matrix
  }
}
