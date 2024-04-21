//
//  CameraBridge.h
//  mrousavy
//
//  Created by Marc Rousavy on 09.11.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

#pragma once

#import <Foundation/Foundation.h>

#import <React/RCTEventEmitter.h>
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>

#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
#import "Frame.h"
#import "FrameProcessor.h"
#import "FrameProcessorPlugin.h"
#import "FrameProcessorPluginRegistry.h"
#import "SharedArray.h"
#import "VisionCameraInstaller.h"
#import "VisionCameraProxyDelegate.h"
#import "VisionCameraProxyHolder.h"
#endif
