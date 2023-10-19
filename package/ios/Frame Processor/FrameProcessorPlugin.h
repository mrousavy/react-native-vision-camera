//
//  FrameProcessorPlugin.h
//  VisionCamera
//
//  Created by Marc Rousavy on 01.05.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#import "Frame.h"
#import <Foundation/Foundation.h>

/// The base class for a Frame Processor Plugin which can be called synchronously from a JS Frame
/// Processor.
///
/// Subclass this class in a Swift or Objective-C class and override the `callback:withArguments:`
/// method, and implement your Frame Processing there.
///
/// Use `[FrameProcessorPluginRegistry addFrameProcessorPlugin:]` to register the Plugin to the
/// VisionCamera Runtime.
@interface FrameProcessorPlugin : NSObject

/// The initializer for a Frame Processor Plugin class that takes optional object that consists
/// options passed from JS layer
- (instancetype _Nonnull)initWithOptions:(NSDictionary* _Nullable)options;

/// The actual callback when calling this plugin. Any Frame Processing should be handled there.
/// Make sure your code is optimized, as this is a hot path.
- (id _Nullable)callback:(Frame* _Nonnull)frame withArguments:(NSDictionary* _Nullable)arguments;

@end

#define VISION_CONCAT2(A, B) A##B
#define VISION_CONCAT(A, B) VISION_CONCAT2(A, B)

#define VISION_EXPORT_FRAME_PROCESSOR(frame_processor_class, frame_processor_plugin_name)                                                  \
  +(void)load {                                                                                                                            \
    [FrameProcessorPluginRegistry addFrameProcessorPlugin:@ #frame_processor_plugin_name                                                   \
                                          withInitializer:^FrameProcessorPlugin*(NSDictionary* _Nullable options) {                        \
                                            return [[frame_processor_class alloc] initWithOptions:options];                                \
                                          }];                                                                                              \
  }

#define VISION_EXPORT_SWIFT_FRAME_PROCESSOR(frame_processor_class, frame_processor_plugin_name)                                            \
                                                                                                                                           \
  @interface frame_processor_class (FrameProcessorPluginLoader)                                                                            \
  @end                                                                                                                                     \
                                                                                                                                           \
  @implementation frame_processor_class (FrameProcessorPluginLoader)                                                                       \
                                                                                                                                           \
  __attribute__((constructor)) static void VISION_CONCAT(initialize_, frame_processor_plugin_name)(void) {                                 \
    [FrameProcessorPluginRegistry addFrameProcessorPlugin:@ #frame_processor_plugin_name                                                   \
                                          withInitializer:^FrameProcessorPlugin* _Nonnull(NSDictionary* _Nullable options) {               \
                                            return [[frame_processor_class alloc] initWithOptions:options];                                \
                                          }];                                                                                              \
  }                                                                                                                                        \
                                                                                                                                           \
  @end
