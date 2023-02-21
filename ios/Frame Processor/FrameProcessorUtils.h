//
//  FrameProcessorUtils.h
//  VisionCamera
//
//  Created by Marc Rousavy on 15.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import "FrameProcessorCallback.h"

#ifndef __cplusplus
#error FrameProcessorUtils.h has to be compiled with C++!
#endif

#import <jsi/jsi.h>
#import "WKTJsiWorklet.h"
#import <memory>

using namespace facebook;

FrameProcessorCallback convertWorkletToFrameProcessorCallback(jsi::Runtime& runtime, std::shared_ptr<RNWorklet::JsiWorklet> worklet);
