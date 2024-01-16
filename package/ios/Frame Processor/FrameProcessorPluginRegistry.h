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

NS_ASSUME_NONNULL_BEGIN

@interface FrameProcessorPluginRegistry : NSObject

typedef FrameProcessorPlugin* _Nonnull (^PluginInitializerFunction)(VisionCameraProxyHolder* proxy, NSDictionary* _Nullable options);

+ (void)addFrameProcessorPlugin:(NSString*)name withInitializer:(PluginInitializerFunction)pluginInitializer;

+ (FrameProcessorPlugin* _Nullable)getPlugin:(NSString*)name
                                   withProxy:(VisionCameraProxyHolder*)proxy
                                 withOptions:(NSDictionary* _Nullable)options;

@end

NS_ASSUME_NONNULL_END
