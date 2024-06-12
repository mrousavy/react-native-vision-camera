//
//  ObjectDetector.swift
//  VisionCameraExample
//
//  Created by Marc Rousavy on 10.05.24.
//

import Foundation
import VisionCamera
import MLKitObjectDetection
import MLKitCommon
import MLKitVision

// Example for a Swift Frame Processor plugin
@objc(ObjectDetectorPlugin)
public class ObjectDetectorPlugin: FrameProcessorPlugin {
  private let detector: ObjectDetector
  
  public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]! = [:]) {
    let opt = ObjectDetectorOptions()
    if let multi = options["multiOutput"] as? Bool {
      opt.shouldEnableMultipleObjects = multi
    }
    self.detector = ObjectDetector.objectDetector(options: opt)
    
    super.init(proxy: proxy, options: options)
  }

  public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any? {
    do {
      let image = VisionImage(buffer: frame.buffer)
      let results = try detector.results(in: image)
      return results.map { obj in
        return [
          "x": obj.frame.origin.x,
          "y": obj.frame.origin.y,
          "width": obj.frame.size.width,
          "height": obj.frame.size.height,
        ]
      }
    } catch (let error) {
      print("Error: \(error.localizedDescription)")
      return []
    }
  }
}
