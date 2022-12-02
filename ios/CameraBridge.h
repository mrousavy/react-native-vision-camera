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

#import "FrameProcessorCallback.h"
#import "FrameProcessorRuntimeManager.h"
#import "Frame.h"
#import "RCTBridge+runOnJS.h"
#import "JSConsoleHelper.h"
#import "PreviewSkiaView.h"

#if DEBUG
// In debug builds, show Frame Processor FPS graph at the top left to debug FP performance
#define SHOW_FPS 1
#endif

#ifdef VISION_CAMERA_DISABLE_FRAME_PROCESSORS
static bool VISION_CAMERA_ENABLE_FRAME_PROCESSORS = false;
#else
static bool VISION_CAMERA_ENABLE_FRAME_PROCESSORS = true;
#endif

#if SHOW_FPS
static bool VISION_CAMERA_SHOW_FPS = true;
#else
static bool VISION_CAMERA_SHOW_FPS = false;
#endif

@interface CameraBridge: RCTViewManager

@end
