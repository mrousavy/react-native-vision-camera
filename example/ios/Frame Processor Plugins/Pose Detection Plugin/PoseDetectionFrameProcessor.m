//
//  PoseDetectionFrameProcessor.m
//  VisionCameraExample
//

#if __has_include(<VisionCamera/FrameProcessorPlugin.h>)
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>

#import "VisionCameraExample-Swift.h"

// Swift Frame Processor plugin registration
VISION_EXPORT_SWIFT_FRAME_PROCESSOR(PoseDetectionFrameProcessorPlugin, pose_detection_plugin)

#endif
