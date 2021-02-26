//
//  FrameProcessorBindings.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 25.02.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import "FrameProcessorBindings.h"
#import "JSI Utils/YeetJSIUtils.h"

#import <React/RCTBridge.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTUIManager.h>
#import <jsi/jsi.h>

#if __has_include("react_native_vision_camera-Swift.h")
#import "react_native_vision_camera-Swift.h"
#elif __has_include("VisionCamera-Swift.h")
#import "VisionCamera-Swift.h"
#else
#error Objective-C Generated Interface Header (VisionCamera-Swift.h) was not found!
#endif


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
                                                                 [&bridge](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
    if (!arguments[0].isNumber()) throw jsi::JSError(runtime, "Camera::setFrameProcessor: First argument ('viewTag') must be a number!");
    if (!arguments[1].isObject()) throw jsi::JSError(runtime, "Camera::setFrameProcessor: Second argument ('frameProcessor') must be a function!");
    
    auto viewTag = arguments[0].asNumber();
    auto worklet = arguments[1].asObject(runtime).asFunction(runtime);
    
    // TODO: Setup new Runtime in which the passed jsi::Function will run in.
    // TODO: "Workletize" the worklet object by passing it to a Reanimated API
    
    auto anonymousView = [bridge.uiManager viewForReactTag:[NSNumber numberWithDouble:viewTag]];
    auto view = static_cast<CameraView*>(anonymousView);
    view.frameProcessor = convertJSIFunctionToCallback(runtime, worklet);
    
    return jsi::Value::undefined();
  });
  jsiRuntime.global().setProperty(jsiRuntime, "setFrameProcessor", std::move(setFrameProcessor));
  
  // unsetFrameProcessor(viewTag: number)
  auto unsetFrameProcessor = jsi::Function::createFromHostFunction(jsiRuntime,
                                                                   jsi::PropNameID::forAscii(jsiRuntime, "unsetFrameProcessor"),
                                                                   1,  // viewTag
                                                                   [&bridge](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
    if (!arguments[0].isNumber()) throw jsi::JSError(runtime, "Camera::unsetFrameProcessor: First argument ('viewTag') must be a number!");
    auto viewTag = arguments[0].asNumber();
    
    auto anonymousView = [bridge.uiManager viewForReactTag:[NSNumber numberWithDouble:viewTag]];
    auto view = static_cast<CameraView*>(anonymousView);
    view.frameProcessor = nil;
    
    return jsi::Value::undefined();
  });
  jsiRuntime.global().setProperty(jsiRuntime, "unsetFrameProcessor", std::move(unsetFrameProcessor));
}

@end

