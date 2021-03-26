//
//  FrameProcessorPluginRegistry.h
//  VisionCamera
//
//  Created by Marc Rousavy on 24.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#pragma once

#import <Foundation/Foundation.h>
#import "FrameProcessorCallback.h"

@interface FrameProcessorPluginRegistry : NSObject

+ (void) addFrameProcessorPlugin:(FrameProcessorCallback)callback;

@end
