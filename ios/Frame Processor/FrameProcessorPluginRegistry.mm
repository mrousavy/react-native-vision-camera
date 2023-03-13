//
//  FrameProcessorPluginRegistry.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 24.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#import "FrameProcessorPluginRegistry.h"
#import <Foundation/Foundation.h>

@implementation FrameProcessorPluginRegistry

+ (NSMutableDictionary<NSString*, FrameProcessorPlugin*>*)frameProcessorPlugins {
  static NSMutableDictionary<NSString*, FrameProcessorPlugin*>* plugins = nil;
  if (plugins == nil) {
    plugins = [[NSMutableDictionary alloc] init];
  }
  return plugins;
}

+ (void) addFrameProcessorPlugin:(FrameProcessorPlugin*)plugin {
  BOOL alreadyExists = [[FrameProcessorPluginRegistry frameProcessorPlugins] valueForKey:plugin.name] != nil;
  NSAssert(!alreadyExists, @"Tried to add a Frame Processor Plugin with a name that already exists! Either choose unique names, or remove the unused plugin. Name: %@", plugin.name);

  [[FrameProcessorPluginRegistry frameProcessorPlugins] setValue:plugin forKey:plugin.name];
}

@end
