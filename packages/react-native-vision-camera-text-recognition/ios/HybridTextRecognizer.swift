//
//  HybridTextRecognizer.swift
//  VisionCameraTextRecognition
//

import MLKitTextRecognition
import MLKitVision
import NitroModules
import VisionCamera

class HybridTextRecognizer: HybridTextRecognizerSpec {
  private let recognizer: TextRecognizer

  override init() {
    self.recognizer = TextRecognizer.textRecognizer(options: TextRecognizerOptions())
    super.init()
  }

  func recognizeText(frame: any HybridFrameSpec) throws -> RecognizedText {
    let image = try frame.toMLImage()
    let text = try recognizer.results(in: image)
    return text.toRecognizedText()
  }

  func recognizeTextAsync(frame: any HybridFrameSpec) throws -> Promise<RecognizedText> {
    let promise = Promise<RecognizedText>()

    let image = try frame.toMLImage()
    recognizer.process(image) { text, error in
      if let error {
        promise.reject(withError: error)
        return
      }
      if let text {
        promise.resolve(withResult: text.toRecognizedText())
      } else {
        promise.resolve(withResult: RecognizedText(text: "", blocks: []))
      }
    }

    return promise
  }
}
