//
//  FrameProcessorUtils.m
//  VisionCamera
//
//  Created by Marc Rousavy on 15.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#include "FrameProcessorUtils.h"
#import <CoreMedia/CMSampleBuffer.h>
#include "../../cpp/Frame.h"

FrameProcessorCallback convertJSIFunctionToFrameProcessorCallback(jsi::Runtime &runtime, const jsi::Function &value) {
  __block auto cb = value.getFunction(runtime);
  
  return ^(CMSampleBufferRef buffer) {
    NSLog(@"Calling jsi::Function Frame Processor with HostObject frame");
    auto frame = vision::Frame(buffer);
    cb.callWithThis(runtime, cb, jsi::Array::createWithElements(runtime, jsi::Value(42)), 1);
  };
}
