//
//  ExampleSwiftFrameProcessor.m
//  VisionCameraExample
//
//  Created by Mateusz Medrek on 02/10/2023.
//

#if __has_include(<VisionCamera/FrameProcessorPlugin.h>)
#import <Foundation/Foundation.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>
#import <VisionCamera/Frame.h>

#import "VisionCameraExample-Swift.h"

// Example for a Swift Frame Processor plugin automatic registration
@interface ExampleSwiftFrameProcessorPlugin (FrameProcessorPluginLoader)
@end

@implementation ExampleSwiftFrameProcessorPlugin (FrameProcessorPluginLoader)

+ (void)initialize {
  [FrameProcessorPluginRegistry addFrameProcessorPlugin:@"example_kotlin_swift_plugin"
                                        withInitializer:^FrameProcessorPlugin* _Nonnull(NSDictionary* _Nullable options) {
    return [[ExampleSwiftFrameProcessorPlugin alloc] init];
  }];
}

@end

#endif
