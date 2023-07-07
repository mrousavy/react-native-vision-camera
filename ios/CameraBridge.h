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
#import "Frame Processor/FrameProcessorCallback.h"
#import "Frame Processor/FrameProcessorRuntimeManager.h"
#import "Frame Processor/Frame.h"
#endif

@interface CameraBridge: RCTViewManager

@end
