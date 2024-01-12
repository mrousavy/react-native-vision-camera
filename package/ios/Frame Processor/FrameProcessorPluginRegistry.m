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

+ (void)addFrameProcessorPlugin:(NSString*)name withInitializer:(PluginInitializerFunction)pluginInitializer {
  BOOL alreadyExists = [[FrameProcessorPluginRegistry frameProcessorPlugins] valueForKey:name] != nil;
  NSAssert(!alreadyExists,
           @"Tried to add a Frame Processor Plugin with a name that already exists! Either choose "
           @"unique names, or "
           @"remove the unused plugin. Name: %@",
           name);

  [[FrameProcessorPluginRegistry frameProcessorPlugins] setValue:pluginInitializer forKey:name];
  NSLog(@"Successfully registered Frame Processor Plugin \"%@\"!", name);
}

+ (FrameProcessorPlugin*)getPlugin:(NSString* _Nonnull)name
                         withProxy:(VisionCameraProxyHolder* _Nonnull)proxy
                       withOptions:(NSDictionary* _Nullable)options {
  NSLog(@"Looking up Frame Processor Plugin \"%@\"...", name);
  PluginInitializerFunction initializer = [[FrameProcessorPluginRegistry frameProcessorPlugins] objectForKey:name];
  if (initializer == nil) {
    NSLog(@"Frame Processor Plugin \"%@\" does not exist!", name);
    return nil;
  }

  NSLog(@"Frame Processor Plugin \"%@\" found! Initializing...", name);
  return initializer(proxy, options);
}

@end
