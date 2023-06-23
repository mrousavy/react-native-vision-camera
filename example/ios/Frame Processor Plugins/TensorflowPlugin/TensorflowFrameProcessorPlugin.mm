//
//  TensorflowFrameProcessorPlugin.m
//  VisionCameraExample
//
//  Created by Marc Rousavy on 22.06.23.
//

#import <Foundation/Foundation.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/Frame.h>
#import <TFLTensorFlowLite.h>

@interface TensorflowFrameProcessorPlugin : FrameProcessorPlugin
@end

@implementation TensorflowFrameProcessorPlugin

- (NSString *)name {
  return @"tensorflow";
}

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
  [self registerPlugin:[[TensorflowFrameProcessorPlugin alloc] init]];
}

@end
