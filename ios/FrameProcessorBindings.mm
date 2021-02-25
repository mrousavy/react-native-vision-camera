//
//  FrameProcessorBindings.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 25.02.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import "FrameProcessorBindings.h"
#import <React/RCTBridge.h>
#import <React/RCTBridge+Private.h>
#import <jsi/jsi.h>

using namespace facebook;

@implementation FrameProcessorBindings


+ (void) installFrameProcessorBindings:(RCTBridge*)bridge {
  RCTCxxBridge *cxxBridge = (RCTCxxBridge *)bridge;
  if (!cxxBridge.runtime) {
    return;
  }
  jsi::Runtime& jsiRuntime = *(jsi::Runtime*)cxxBridge.runtime;
  
  
  // setFrameProcessor(viewTag: number, frameProcessor: (frame: Frame) => void)
  auto setFrameProcessor = jsi::Function::createFromHostFunction(jsiRuntime,
                                                                 jsi::PropNameID::forAscii(jsiRuntime, "setFrameProcessor"),
                                                                 2,  // viewTag, frameProcessor
                                                                 [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
    if (!arguments[0].isNumber()) throw jsi::JSError(runtime, "Camera::setFrameProcessor: First argument ('viewTag') must be a number!");
    if (!arguments[1].isObject()) throw jsi::JSError(runtime, "Camera::setFrameProcessor: Second argument ('frameProcessor') must be a function!");
    auto viewTag = arguments[0].getNumber();
    
    return jsi::Value::undefined();
  });
  jsiRuntime.global().setProperty(jsiRuntime, "setFrameProcessor", std::move(setFrameProcessor));
  
}

@end

