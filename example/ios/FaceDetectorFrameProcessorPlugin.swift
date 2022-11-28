//
//  FaceDetectorFrameProcessorPlugin.swift
//  VisionCameraExample
//
//  Created by Marc Rousavy on 24.11.22.
//

import Foundation
import Vision
import TensorFlowLite

@available(iOS 13.0, *)
@objc(FaceDetectorFrameProcessorPlugin)
public class FaceDetectorFrameProcessorPlugin: NSObject, FrameProcessorPluginBase {
  
  static var modelInterpreter: Interpreter?
  static let inputSize = 128
  static var isConfiguringModel = false
  static let ams = AverageMaximumSuppresion()

  static func configureModel() {
    isConfiguringModel = true
    do {
      let path = Bundle.main.path(forResource: "face_detection_short_range", ofType: "tflite")!
      let interpreter = try Interpreter(modelPath: path)
      try interpreter.allocateTensors()
      modelInterpreter = interpreter
    }
    catch {
      print(error.localizedDescription)
    }
    isConfiguringModel = false
  }
  
  // Array is flattened and the first 4 elements of each 16 chunk is the
  // x,y,width,height components
  static func getArrays(boxes: [Float]) -> (xArray: [Float], yarray: [Float], width: [Float], height: [Float]) {
    var xArray: [Float] = []
    var yarray: [Float] = []
    var width: [Float] = []
    var height: [Float] = []
    
    for i in 0..<896 {
      xArray.append(boxes[16 * i])
      yarray.append(boxes[16 * i + 1])
      width.append(boxes[16 * i + 2])
      height.append(boxes[16 * i + 3])
    }
    
    return (xArray, yarray, width, height)
  }
  
  @objc
  public static func callback(_ frame: Frame!, withArgs _: [Any]!) -> Any! {
    // Load in the model
    guard let model = modelInterpreter else {
      if isConfiguringModel == false {
        configureModel()
      }
      return nil
    }
    // Get the image buffer from CMSampleBuffer
    guard let imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer) else {
      return nil
    }
    let imageWidth = CVPixelBufferGetWidth(imageBuffer)
    let imageHeight = CVPixelBufferGetHeight(imageBuffer)
    
    do {
      // Prepare input tensor
      // 1. Crops the image to the biggest square in the center and scales it down to model dimensions.
      // 2. Get 3 channel RGB data from the image buffer
      let inputTensor = try model.input(at: 0)
      let scaledSize = CGSize(width: inputSize, height: inputSize)
      guard let scaledPixelBuffer = imageBuffer.resized(to: scaledSize) else {
        return nil
      }
      guard let inputData = rgbDataFromBuffer(
        scaledPixelBuffer,
        byteCount: 1 * inputSize * inputSize * 3,
        isModelQuantized: inputTensor.dataType == .uInt8
      ) else {
        print("Failed to convert the image buffer to RGB data.")
        return nil
      }
      // Copy the RGB data to the input `Tensor` and invoke the model
      try model.copy(inputData, toInputAt: 0)
      try model.invoke()
      let _regressors = try model.output(at: 0) // [1, 896, 16]
      let _classificators = try model.output(at: 1) // [1, 896, 1]
      let classifications = [Float](unsafeData: _classificators.data) ?? []
      let regressors = [Float](unsafeData: _regressors.data) ?? []
      
      // This takes the SSD anchor regressions and maps them to actual BBs
      let arrays = getArrays(boxes: regressors)
      let finalBoxes: [BoxPrediction] = ams.getFinalBoxes(rawXArray: arrays.xArray, rawYArray: arrays.yarray, rawWidthArray: arrays.width, rawHeightArray: arrays.height, classPredictions: classifications, imageWidth: Float(imageWidth), imageHeight: Float(imageHeight), cameraSize: CGRect(origin: .zero, size: CGSize(width: imageWidth, height: imageHeight)))
      
      // Format and return the boxes
      return finalBoxes.map {
        [
          "boundingBox": [
            "x": $0.rect.origin.x,
            "y": $0.rect.origin.y,
            "width": $0.rect.width,
            "height": $0.rect.height,
          ],
          "score": $0.score
        ]
      }
    
    }
    catch {
      return nil
    }
  }
}
