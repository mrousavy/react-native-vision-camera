//
//  FrameProcessorUtils.m
//  VisionCamera
//
//  Created by Marc Rousavy on 15.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import "FrameProcessorUtils.h"
#import <CoreMedia/CMSampleBuffer.h>
#import <chrono>
#import <memory>
#import "FrameHostObject.h"

FrameProcessorCallback convertJSIFunctionToFrameProcessorCallback(jsi::Runtime &runtime, const jsi::Function &value) {
  __block auto cb = value.getFunction(runtime);
  
  return ^(CMSampleBufferRef buffer) {
    NSLog(@"Calling Frame Processor...");
    std::chrono::steady_clock::time_point begin = std::chrono::steady_clock::now();
    
    auto frame = std::make_shared<FrameHostObject>(buffer);
    auto object = jsi::Object::createFromHostObject(runtime, frame);
    cb.callWithThis(runtime, cb, object);
    
    std::chrono::steady_clock::time_point end = std::chrono::steady_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - begin);
    NSLog(@"Finished Frame Processor execution in %lld", duration.count());
  };
}
