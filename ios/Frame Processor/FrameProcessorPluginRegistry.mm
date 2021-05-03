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

static BOOL _isValid = YES;
+ (void) markInvalid {
  _isValid = NO;
  [[FrameProcessorPluginRegistry frameProcessorPlugins] removeAllObjects];
}

+ (void) addFrameProcessorPlugin:(NSString*)name callback:(FrameProcessorPlugin)callback {
  NSAssert(_isValid, @"Tried to add Frame Processor Plugin but Frame Processor Registry has already registered all plugins!");
  
  BOOL alreadyExists = [[FrameProcessorPluginRegistry frameProcessorPlugins] valueForKey:name] != nil;
  NSAssert(!alreadyExists, @"Tried to two Frame Processor Plugins with the same name! Either choose unique names, or remove the unused plugin.");
  
  [[FrameProcessorPluginRegistry frameProcessorPlugins] setValue:callback forKey:name];
}

@end
