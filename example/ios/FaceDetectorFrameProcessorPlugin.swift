//
//  FaceDetectorFrameProcessorPlugin.swift
//  VisionCameraExample
//
//  Created by Marc Rousavy on 24.11.22.
//

import CoreML
import Foundation
import Vision
import Accelerate
import CoreGraphics
import CoreImage
import VideoToolbox



class BlazeFaceInput: MLFeatureProvider {
  private static let imageFeatureName = "image"
  
  var imageFeature: CGImage
  
  var featureNames: Set<String> {
    return [BlazeFaceInput.imageFeatureName]
  }
  
  init(image: CGImage) {
    imageFeature = image
  }
  
  func featureValue(for featureName: String) -> MLFeatureValue? {
    guard featureName == BlazeFaceInput.imageFeatureName else {
      return nil
    }
    
    if #available(iOS 13.0, *) {
      let options: [MLFeatureValue.ImageOption: Any] = [
        .cropAndScale: VNImageCropAndScaleOption.scaleFit.rawValue
      ]
      
      return try? MLFeatureValue(cgImage: imageFeature,
                                 pixelsWide: 128,
                                 pixelsHigh: 128,
                                 pixelFormatType: imageFeature.pixelFormatInfo.rawValue,
                                 options: options)
    } else {
      return nil
    }
  }
}

public func IOU(_ a: SIMD16<Float32>, _ b: SIMD16<Float32>) -> Float {
  let areaA = (a[3]-a[1]) * (a[2]-a[0])
  if areaA <= 0 { return 0 }
  
  let areaB = (b[3]-b[1]) * (b[2]-b[0])
  if areaB <= 0 { return 0 }
  
  let intersectionMinX = max(a[1], b[1])
  let intersectionMinY = max(a[0], b[0])
  let intersectionMaxX = min(a[3], b[3])
  let intersectionMaxY = min(a[2], b[2])
  let intersectionArea = max(intersectionMaxY - intersectionMinY, 0) *
  max(intersectionMaxX - intersectionMinX, 0)
  return Float(intersectionArea / (areaA + areaB - intersectionArea))
}

class Face {
  static let minBox = 0
  static let maxBox = 1
  static let rightEye = 2
  static let leftEye = 3
  static let nose = 4
  static let mouth = 5
  static let rightEar = 6
  static let leftEar = 7
  
  var landmark: Array<SIMD2<Double>>
  var confidence: Float
  
  init(landmark: Array<SIMD2<Double>>, confidence: Float) {
    self.landmark = landmark
    self.confidence = confidence
  }
}


@objc(FaceDetectorFrameProcessorPlugin)
public class FaceDetectorFrameProcessorPlugin: NSObject, FrameProcessorPluginBase {
  
  static var model: MLModel {
    if #available(iOS 13.0, *) {
      return BlazeFaceScaled()!.model!
    } else {
      fatalError("not on ios 13")
    }
  }
  static let minConfidence: Float32 = 0.75
  static let nmsThresh = 0.3
  
  @objc
  public static func callback(_ frame: Frame!, withArgs _: [Any]!) -> Any! {
    let pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer)!
    let imageWidth = CVPixelBufferGetWidth(pixelBuffer)
    let imageHeight = CVPixelBufferGetHeight(pixelBuffer)
    
    
    var imageFeature: CGImage?
    VTCreateCGImageFromCVPixelBuffer(pixelBuffer, options: nil, imageOut: &imageFeature)
    let imgH = Float32(imageFeature!.height)
    let imgW = Float32(imageFeature!.width)
    
    let hScale = max(imgH, imgW) / imgH
    let wScale = max(imgH, imgW) / imgW
    let scaleSIMD = SIMD2(Double(wScale), Double(hScale))
    let shiftSIMD = SIMD2(Double(wScale-1)/2.0, Double(hScale-1)/2.0)
    
    let x = BlazeFaceInput(image: imageFeature!)
    guard let points = try? self.model.prediction(from: x) else {
      return []
    }
    let rPointsMLArray = points.featureValue(for: "1477")?.multiArrayValue
    let rPoints = rPointsMLArray?.dataPointer.bindMemory(to: SIMD16<Float32>.self, capacity: rPointsMLArray!.count/16) // 896 x 8 x 2 -> 2 bounding box + 6 keypoints
    let rArray = [SIMD16<Float32>](UnsafeBufferPointer(start: rPoints, count: rPointsMLArray!.count/16))
    
    
    let cMLArray = points.featureValue(for: "1011")?.multiArrayValue
    let c = cMLArray?.dataPointer.bindMemory(to: Float32.self, capacity: cMLArray!.count)
    let cArray = [Float32](UnsafeBufferPointer(start: c, count: cMLArray!.count))
    
    // Apply custom NMS
    var cIndices = cArray.enumerated().filter({ $0.element >= self.minConfidence }).map({ $0.offset })
    cIndices.sort(by: { cArray[$0] > cArray[$1] })
    
    var retRArray = Array<Face>()
    
    while cIndices.count > 0 {
      var overlapRs = Array<SIMD16<Float32>>()
      var overlapCscore: Float32 = 0.0
      var nonOverlapI = Array<Int>()
      for i in 0..<cIndices.count {
        // find IoU with everything
        // remove overlapping ones and average them out
        let iiou = IOU(rArray[cIndices[0]], rArray[cIndices[i]])
        if iiou >= 0.3 {
          overlapRs.append(cArray[cIndices[i]]*rArray[cIndices[i]])
          overlapCscore += cArray[cIndices[i]]
        } else {
          nonOverlapI.append(cIndices[i])
        }
      }
      cIndices = nonOverlapI
      let averageR = overlapRs.reduce(SIMD16<Float32>(repeating: 0), +) / overlapCscore
      var faceR = Array<SIMD2<Double>>()
      for i in 0..<8 {
        let faceL = SIMD2(Double(averageR[2*i]), Double(averageR[2*i+1])) * scaleSIMD - shiftSIMD
        faceR.append(faceL)
      }
      retRArray.append(Face(landmark: faceR, confidence: overlapCscore / Float(overlapRs.count)))
    }
    
    
    return retRArray.map { face in
      return [
        "landmarks": face.landmark.map({ landmark in
          return [
            "x": landmark.x,
            "y": landmark.y
          ]
        })
      ]
    }
  }
}
