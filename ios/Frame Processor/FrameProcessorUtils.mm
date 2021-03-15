//
//  FrameProcessorUtils.m
//  VisionCamera
//
//  Created by Marc Rousavy on 15.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#include "FrameProcessorUtils.h"

FrameProcessorCallback convertJSIFunctionToFrameProcessorCallback(jsi::Runtime &runtime, const jsi::Function &value) {
  __block auto cb = value.getFunction(runtime);
  
  return ^(jsi::HostObject frame) {
    NSLog(@"Calling jsi::Function Frame Processor with HostObject frame");
    cb.callWithThis(runtime, cb, jsi::Array::createWithElements(runtime, frame), 1);
  };
}
