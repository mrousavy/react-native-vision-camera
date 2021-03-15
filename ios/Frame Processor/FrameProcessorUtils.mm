//
//  FrameProcessorUtils.m
//  VisionCamera
//
//  Created by Marc Rousavy on 15.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#include "FrameProcessorUtils.h"
#include <CoreMedia/CoreMedia.h>
#include "../../cpp/Frame.h"

FrameProcessorCallback convertJSIFunctionToFrameProcessorCallback(jsi::Runtime &runtime, const jsi::Function &value) {
  __block auto cb = value.getFunction(runtime);
  
  return ^(CMSampleBufferRef buffer) {
    NSLog(@"Calling jsi::Function Frame Processor with HostObject frame");
    cb.callWithThis(runtime, cb, vision::Frame(buffer), 1);
  };
}
