//
//  FrameProcessorPlugin.h
//  VisionCamera
//
//  Created by Marc Rousavy on 01.05.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#ifndef FrameProcessorPlugin_h
#define FrameProcessorPlugin_h

#import "FrameProcessorPluginRegistry.h"
#import <CoreMedia/CMSampleBuffer.h>

#define VISION_CONCAT2(A, B) A##B
#define VISION_CONCAT(A, B) VISION_CONCAT2(A, B)

/**
 * Place this macro in your class implementation to automatically register
 * your module with the bridge when it loads. The optional js_name argument
 * will be used as the JS module name. If omitted, the JS module name will
 * match the Objective-C class name.
 */
#define VISION_EXPORT_FRAME_PROCESSOR(name, callback)          \
\
+(void)load                               \
{                                         \
SEL selector = @selector(callback:);    \
[FrameProcessorPluginRegistry addFrameProcessorPlugin:@ #name callback:^id(CMSampleBufferRef buffer) { \
return [NSNull performSelector:selector withObject:(__bridge id)(buffer)]; \
}]; \
}

/**
 * Same as VISION_EXPORT_FRAME_PROCESSOR, but uses __attribute__((constructor)) for module
 * registration. Useful for registering swift classes that forbids use of load
 * Used in RCT_EXTERN_REMAP_MODULE
 */
#define VISION_EXPORT_SWIFT_FRAME_PROCESSOR(name, objc_name, objc_supername) \
objc_name:                                                        \
objc_supername @                                                  \
end @interface objc_name(FrameProcessorPlugin)        \
@end                                                              \
@implementation objc_name (FrameProcessorPlugin)                       \
\
  + (id) callback:(CMSampleBufferRef)buffer; \
\
  __attribute__((constructor)) static void VISION_CONCAT(initialize_, objc_name)() \
  {                                                                             \
    SEL selector = @selector(callback:);    \
    [FrameProcessorPluginRegistry addFrameProcessorPlugin:@ #name callback:^id(CMSampleBufferRef buffer) { \
      return [objc_name callback:buffer]; \
    }]; \
  }

#endif /* FrameProcessorPlugin_h */
