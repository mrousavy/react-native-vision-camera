//
//  FrameProcessorPluginRegistry.h
//  VisionCamera
//
//  Created by Marc Rousavy on 24.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#pragma once

#import <Foundation/Foundation.h>
#import <jsi/jsi.h>
#import <CoreMedia/CMSampleBuffer.h>

typedef facebook::jsi::Value (^FrameProcessorPlugin) (CMSampleBufferRef buffer);

@interface FrameProcessorPluginRegistry : NSObject

+ (NSMutableDictionary<NSString*, FrameProcessorPlugin>*)frameProcessorPlugins;

+ (void) addFrameProcessorPlugin:(NSString*)name callback:(FrameProcessorPlugin)callback;

@end
