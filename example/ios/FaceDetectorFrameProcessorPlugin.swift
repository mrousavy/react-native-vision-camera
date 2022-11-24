//
//  FaceDetectorFrameProcessorPlugin.swift
//  VisionCameraExample
//
//  Created by Marc Rousavy on 24.11.22.
//

import Foundation
import Vision
import CoreML

@objc(FaceDetectorFrameProcessorPlugin)
public class FaceDetectorFrameProcessorPlugin: NSObject, FrameProcessorPluginBase {
  static var imageWidth = 0
  static var imageHeight = 0
  static var boxes: [BoxPrediction] = []
  static var cameraSizeRect: CGRect {
    get {
      return UIScreen.main.bounds
    }
  }
  
  static var classificationRequest: VNCoreMLRequest {
    let config = MLModelConfiguration()
    config.computeUnits = .cpuOnly
    
    do {
      if #available(iOS 13.0, *) {
        
        let model = try Face500(configuration: config)
        let visionModel = try VNCoreMLModel(for: model.model!)
        
        let visionRequest = VNCoreMLRequest(model: visionModel) { request, error in
          
          guard let results = (request.results as? [VNCoreMLFeatureValueObservation]) else {
            fatalError("Unexpected result type from VNCoreMLRequest")
          }
          
          guard let predictions = results[0].featureValue.multiArrayValue else {
            fatalError("Result 0 is not a MultiArray")
          }
          
          var arrayPredictions: [Float] = []
          
          for i in 0..<predictions.count {
            arrayPredictions.append(predictions[i].floatValue)
          }
          
          guard let boxes = results[1].featureValue.multiArrayValue else {
            fatalError("Result 1 is not a MultiArray")
          }
          
          self.boxes = self.getFinalBoxes(boxes: boxes, arrayPredictions: arrayPredictions)
        }
        
        visionRequest.imageCropAndScaleOption = .centerCrop
        return visionRequest
      } else {
        fatalError("Face500 detection Model can only be used on iOS 13.0 or newer!")
      }
      
    } catch {
      fatalError("Failed to load ML model: \(error)")
    }
  }
  
  static let AMS = AverageMaximumSuppresion()
  
  static func getFinalBoxes(boxes: MLMultiArray, arrayPredictions: [Float]) -> [BoxPrediction] {
    
    let arrays = getArrays(boxes: boxes)
    
    let finalBoxes: [BoxPrediction] = AMS.getFinalBoxes(rawXArray: arrays.xArray, rawYArray: arrays.yarray, rawWidthArray: arrays.width, rawHeightArray: arrays.height, classPredictions: arrayPredictions, imageWidth: Float(imageWidth), imageHeight: Float(imageHeight), cameraSize: cameraSizeRect)
    
    return finalBoxes
  }
  
  static let boxesCount = 896
  
  static func getArrays(boxes: MLMultiArray) -> (xArray: [Float], yarray: [Float], width: [Float], height: [Float]) {
    var xArray: [Float] = []
    var yarray: [Float] = []
    var width: [Float] = []
    var height: [Float] = []
    
    for i in 0..<boxesCount {
      xArray.append(boxes[4 * i].floatValue)
      yarray.append(boxes[4 * i + 1].floatValue)
      width.append(boxes[4 * i + 2].floatValue)
      height.append(boxes[4 * i + 3].floatValue)
    }
    
    return (xArray, yarray, width, height)
  }
  
  
  
  
  @objc
  public static func callback(_ frame: Frame!, withArgs _: [Any]!) -> Any! {
    
    let pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer)!
    imageWidth = CVPixelBufferGetWidth(pixelBuffer)
    imageHeight = CVPixelBufferGetHeight(pixelBuffer)
    
    let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: .up)
    
    do {
      try handler.perform([classificationRequest])
    } catch {
      print("Failed to perform classification: \(error.localizedDescription)")
    }
    
    
    // code goes here
    return self.boxes.map { box in
      return [
        "rect": [
          "x": box.rect.origin.x,
          "y": box.rect.origin.y,
          "width": box.rect.size.width,
          "height": box.rect.size.height
        ],
        "score": box.score
      ]
    }
  }
}
