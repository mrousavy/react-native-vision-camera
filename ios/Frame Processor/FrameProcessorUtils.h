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

using namespace facebook;

FrameProcessorCallback convertJSIFunctionToFrameProcessorCallback(jsi::Runtime &runtime, const jsi::Function &value);
