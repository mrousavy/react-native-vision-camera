//
//  RecognizedTextMapper.swift
//  VisionCameraTextRecognition
//

import CoreGraphics
import Foundation
import MLKitTextRecognition
import NitroModules

private typealias MLText = MLKitTextRecognition.Text
private typealias MLTextBlock = MLKitTextRecognition.TextBlock
private typealias MLTextLine = MLKitTextRecognition.TextLine
private typealias MLTextElement = MLKitTextRecognition.TextElement
private typealias NitroTextBlock = margelo.nitro.camera.textrecognition.TextBlock
private typealias NitroTextLine = margelo.nitro.camera.textrecognition.TextLine
private typealias NitroTextElement = margelo.nitro.camera.textrecognition.TextElement

private func toRect(_ frame: CGRect) -> Rect {
  return Rect(
    left: frame.origin.x,
    right: frame.origin.x + frame.size.width,
    top: frame.origin.y,
    bottom: frame.origin.y + frame.size.height)
}

private func toPoints(_ values: [NSValue]?) -> [Point] {
  guard let values else {
    return []
  }
  return values.map { value in
    let point = value.cgPointValue
    return Point(x: point.x, y: point.y)
  }
}

private func toLanguageCodes(_ languages: [TextRecognizedLanguage]) -> [String] {
  return languages.compactMap { language in
    guard let code = language.languageCode, !code.isEmpty else {
      return nil
    }
    return code
  }
}

extension MLTextElement {
  fileprivate func toNitroTextElement() -> NitroTextElement {
    return NitroTextElement(
      text: text,
      boundingBox: toRect(frame),
      cornerPoints: toPoints(cornerPoints),
      recognizedLanguages: toLanguageCodes(recognizedLanguages))
  }
}

extension MLTextLine {
  fileprivate func toNitroTextLine() -> NitroTextLine {
    return NitroTextLine(
      text: text,
      boundingBox: toRect(frame),
      cornerPoints: toPoints(cornerPoints),
      recognizedLanguages: toLanguageCodes(recognizedLanguages),
      elements: elements.map { $0.toNitroTextElement() })
  }
}

extension MLTextBlock {
  fileprivate func toNitroTextBlock() -> NitroTextBlock {
    return NitroTextBlock(
      text: text,
      boundingBox: toRect(frame),
      cornerPoints: toPoints(cornerPoints),
      recognizedLanguages: toLanguageCodes(recognizedLanguages),
      lines: lines.map { $0.toNitroTextLine() })
  }
}

extension MLText {
  func toRecognizedText() -> RecognizedText {
    return RecognizedText(
      text: text,
      blocks: blocks.map { $0.toNitroTextBlock() })
  }
}
