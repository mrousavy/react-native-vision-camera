//
//  FrameProcessorPluginRegistry.m
//  VisionCamera
//
//  Created by Marc Rousavy on 24.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#import "FrameProcessorPluginRegistry.h"
#import <Foundation/Foundation.h>

@implementation FrameProcessorPluginRegistry

+ (NSMutableDictionary<NSString*, PluginInitializerFunction>*)frameProcessorPlugins {
  static NSMutableDictionary<NSString*, PluginInitializerFunction>* plugins = nil;
  if (plugins == nil) {
    plugins = [[NSMutableDictionary alloc] init];
  }
  return plugins;
}

+ (void)addFrameProcessorPlugin:(NSString*)name
                withInitializer:(PluginInitializerFunction)pluginInitializer {
  BOOL alreadyExists =
      [[FrameProcessorPluginRegistry frameProcessorPlugins] valueForKey:name] != nil;
  NSAssert(!alreadyExists,
           @"Tried to add a Frame Processor Plugin with a name that already exists! Either choose "
           @"unique names, or "
           @"remove the unused plugin. Name: %@",
           name);

  [[FrameProcessorPluginRegistry frameProcessorPlugins] setValue:pluginInitializer forKey:name];
}

+ (FrameProcessorPlugin*)getPlugin:(NSString* _Nonnull)name
                       withOptions:(NSDictionary* _Nullable)options {
  PluginInitializerFunction initializer =
      [[FrameProcessorPluginRegistry frameProcessorPlugins] objectForKey:name];
  if (initializer == nil) {
    return nil;
  }

  return initializer(options);
}

@end
