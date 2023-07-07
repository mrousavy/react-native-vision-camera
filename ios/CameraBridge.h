//
//  CameraBridge.h
//  mrousavy
//
//  Created by Marc Rousavy on 09.11.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

#pragma once

#import <Foundation/Foundation.h>

#import <React/RCTViewManager.h>
#import <React/RCTUIManager.h>
#import <React/RCTFPSGraph.h>

#if VISION_ENABLE_FRAME_PROCESSORS
#import "FrameProcessorCallback.h"
#import "FrameProcessorRuntimeManager.h"
#import "Frame.h"
#endif

@interface CameraBridge: RCTViewManager

@end
