//
//  FrameProcessorPluginRegistry.h
//  VisionCamera
//
//  Created by Marc Rousavy on 24.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#import "Frame.h"
#import "FrameProcessorPlugin.h"
#import "VisionCameraProxy.h"
#import <Foundation/Foundation.h>

@interface FrameProcessorPluginRegistry : NSObject

typedef FrameProcessorPlugin* _Nonnull (^PluginInitializerFunction)(VisionCameraProxyHolder* _Nonnull proxy,
                                                                    NSDictionary* _Nullable options);

+ (void)addFrameProcessorPlugin:(NSString* _Nonnull)name withInitializer:(PluginInitializerFunction _Nonnull)pluginInitializer;

+ (FrameProcessorPlugin* _Nullable)getPlugin:(NSString* _Nonnull)name
                                   withProxy:(VisionCameraProxyHolder* _Nonnull)proxy
                                 withOptions:(NSDictionary* _Nullable)options;

@end
