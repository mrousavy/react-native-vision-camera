//
//  ExampleSwiftFrameProcessor.swift
//  VisionCameraExample
//
//  Created by Mateusz Medrek on 02/10/2023.
//

#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
import VisionCamera

// Example for a Swift Frame Processor plugin
@objc(ExampleSwiftFrameProcessorPlugin)
public class ExampleSwiftFrameProcessorPlugin: FrameProcessorPlugin {
  public override init(options: [AnyHashable: Any]! = [:]) {
    super.init(options: options)

    print("ExampleSwiftPlugin - options: \(String(describing: options))")
  }

  public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any? {
    let imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer)

    if let arguments, let imageBuffer {
      let width = CVPixelBufferGetWidth(imageBuffer)
      let height = CVPixelBufferGetHeight(imageBuffer)
      let count = arguments.count

      print(
        "ExampleSwiftPlugin: \(width) x \(height) Image. Logging \(count) parameters:"
      )

      for key in arguments.keys {
        let value = arguments[key]
        let valueString = String(describing: value)
        let valueClassString = String(describing: value.self)
        print("ExampleSwiftPlugin:   -> \(valueString) (\(valueClassString))")
      }
    }

    return [
      "example_str": "SwiftTest",
      "example_bool": false,
      "example_double": 6.7,
      "example_array": ["Good bye", false, 21.37]
    ]
  }
}
#endif
