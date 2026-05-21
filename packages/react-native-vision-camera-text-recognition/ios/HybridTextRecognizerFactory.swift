//
//  HybridTextRecognizerFactory.swift
//  VisionCameraTextRecognition
//

import NitroModules
import VisionCamera

class HybridTextRecognizerFactory: HybridTextRecognizerFactorySpec {
  func createTextRecognizer() throws -> any HybridTextRecognizerSpec {
    return HybridTextRecognizer()
  }

  func createTextRecognitionOutput(options: TextRecognitionOutputOptions) throws
    -> any HybridCameraOutputSpec
  {
    return HybridTextRecognitionOutput(options: options)
  }
}
