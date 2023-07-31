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

- (id)callback:(Frame *)frame withArguments:(NSArray<id> *)arguments {
  CVPixelBufferRef imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
  NSLog(@"ExamplePlugin: %zu x %zu Image. Logging %lu parameters:", CVPixelBufferGetWidth(imageBuffer), CVPixelBufferGetHeight(imageBuffer), (unsigned long)arguments.count);

  for (id param in arguments) {
    NSLog(@"ExamplePlugin:   -> %@ (%@)", param == nil ? @"(nil)" : [param description], NSStringFromClass([param classForCoder]));
  }

  return @{
    @"example_str": @"Test",
    @"example_bool": @true,
    @"example_double": @5.3,
    @"example_array": @[
      @"Hello",
      @true,
      @17.38
    ]
  };
}

+ (void) load {
  [FrameProcessorPluginRegistry addFrameProcessorPlugin:@"example_plugin"
                                        withInitializer:^FrameProcessorPlugin*(NSDictionary* options) {
    return [[ExampleFrameProcessorPlugin alloc] init];
  }];
}

@end
#endif
