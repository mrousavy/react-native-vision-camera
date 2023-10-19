//
//  ExampleFrameProcessorPlugin.m
//  VisionCameraExample
//
//  Created by Marc Rousavy on 01.05.21.
//

#if __has_include(<VisionCamera/FrameProcessorPlugin.h>)
#import <Foundation/Foundation.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>
#import <VisionCamera/Frame.h>

// Example for an Objective-C Frame Processor plugin

@interface ExampleFrameProcessorPlugin : FrameProcessorPlugin
@end

@implementation ExampleFrameProcessorPlugin

- (instancetype)initWithOptions:(NSDictionary* _Nullable)options
{
  self = [super initWithOptions:options];
  NSLog(@"ExampleFrameProcessorPlugin initialized with options: %@", options);
  return self;
}

- (id)callback:(Frame *)frame withArguments:(NSDictionary *)arguments {
  CVPixelBufferRef imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
  NSLog(@"ExamplePlugin: %zu x %zu Image. Logging %lu parameters:", CVPixelBufferGetWidth(imageBuffer), CVPixelBufferGetHeight(imageBuffer), (unsigned long)arguments.count);

  for (id param in arguments) {
    NSLog(@"ExamplePlugin:   -> %@ (%@)", param == nil ? @"(nil)" : [param description], NSStringFromClass([param classForCoder]));
  }

  return @{
    @"example_str": @"Test",
    @"example_bool": @(YES),
    @"example_double": @5.3,
    @"example_array": @[
      @"Hello",
      @(YES),
      @17.38
    ]
  };
}

VISION_EXPORT_FRAME_PROCESSOR(ExampleFrameProcessorPlugin, example_plugin)

@end
#endif
