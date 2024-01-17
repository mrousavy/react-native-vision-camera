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
#import <VisionCamera/SharedArray.h>

// Example for an Objective-C Frame Processor plugin

@interface ExampleFrameProcessorPlugin : FrameProcessorPlugin
@end

@implementation ExampleFrameProcessorPlugin {
  SharedArray* _sharedArray;
}

- (instancetype)initWithProxy:(VisionCameraProxyHolder*)proxy
                  withOptions:(NSDictionary* _Nullable)options {
  if (self = [super initWithProxy:proxy withOptions:options]) {
    _sharedArray = [[SharedArray alloc] initWithProxy:proxy
                                                 size:5];
    NSLog(@"ExampleFrameProcessorPlugin initialized with options: %@", options);
  }
  return self;
}

- (id)callback:(Frame *)frame withArguments:(NSDictionary *)arguments {
  CVPixelBufferRef imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
  NSLog(@"ExamplePlugin: %zu x %zu Image. Logging %lu parameters:", CVPixelBufferGetWidth(imageBuffer), CVPixelBufferGetHeight(imageBuffer), (unsigned long)arguments.count);

  for (id param in arguments) {
    NSLog(@"ExamplePlugin:   -> %@ (%@)", param == nil ? @"(nil)" : [param description], NSStringFromClass([param classForCoder]));
  }

  uint8_t* data = _sharedArray.data;
  data[0] = (uint8_t)(random() * 100);

  return @{
    @"example_str": @"Test",
    @"example_bool": @(YES),
    @"example_double": @5.3,
    @"example_array": @[
      @"Hello",
      @(YES),
      @17.38
    ],
    @"example_array_buffer": _sharedArray
  };
}

VISION_EXPORT_FRAME_PROCESSOR(ExampleFrameProcessorPlugin, example_plugin)

@end
#endif
