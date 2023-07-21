//
//  FrameProcessorPluginRegistry.h
//  VisionCamera
//
//  Created by Marc Rousavy on 24.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#import <Foundation/Foundation.h>
#import "Frame.h"
#import "FrameProcessorPlugin.h"

@interface FrameProcessorPluginRegistry : NSObject

typedef FrameProcessorPlugin* _Nonnull (^PluginInitializerFunction)(NSDictionary* _Nullable options);

+ (void)addFrameProcessorPlugin:(NSString* _Nonnull)name
                withInitializer:(PluginInitializerFunction _Nonnull)pluginInitializer;

+ (FrameProcessorPlugin* _Nullable)getPlugin:(NSString* _Nonnull)name
                                 withOptions:(NSDictionary* _Nullable)options;

@end
