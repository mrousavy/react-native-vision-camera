//
//  FrameProcessorPluginRegistry.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 24.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import "FrameProcessorPluginRegistry.h"
#import <Foundation/Foundation.h>

@implementation FrameProcessorPluginRegistry

+ (NSMutableDictionary<NSString*, FrameProcessorPlugin>*)frameProcessorPlugins {
  static NSMutableDictionary<NSString*, FrameProcessorPlugin>* plugins = nil;
  if (plugins == nil) {
    plugins = [[NSMutableDictionary alloc] init];
  }
  return plugins;
}

+ (void) addFrameProcessorPlugin:(NSString*)name callback:(FrameProcessorPlugin)callback {
  [[FrameProcessorPluginRegistry frameProcessorPlugins] setValue:callback forKey:name];
}

@end
