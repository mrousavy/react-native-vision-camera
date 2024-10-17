//
//  ExampleSwiftFrameProcessor.m
//  VisionCameraExample
//
//  Created by Mateusz Medrek on 02/10/2023.
//

#if __has_include(<VisionCamera/FrameProcessorPlugin.h>)
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>

#import "VisionCameraExample-Swift.h"

// // Example for a Swift Frame Processor plugin automatic registration
VISION_EXPORT_SWIFT_FRAME_PROCESSOR(ExampleSwiftFrameProcessorPlugin, example_kotlin_swift_plugin)

#endif
