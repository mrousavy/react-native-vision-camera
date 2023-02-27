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

+ (NSMutableDictionary<NSString*, FrameProcessorPlugin*>*)frameProcessorPlugins;
+ (void) addFrameProcessorPlugin:(FrameProcessorPlugin*)plugin;

@end
