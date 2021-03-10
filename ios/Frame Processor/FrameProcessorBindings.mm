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
#import <React/RCTUIManager.h>

#import <jsi/jsi.h>
#import "../JSI Utils/YeetJSIUtils.h"
#import "FrameProcessorDelegate.h"

#if __has_include("VisionCamera-Swift.h")
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
  auto setFrameProcessor = [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
    NSLog(@"FrameProcessorBindings: Setting new frame processor...");
    if (!arguments[0].isNumber()) throw jsi::JSError(runtime, "Camera::setFrameProcessor: First argument ('viewTag') must be a number!");
    if (!arguments[1].isObject()) throw jsi::JSError(runtime, "Camera::setFrameProcessor: Second argument ('frameProcessor') must be a function!");

    auto viewTag = arguments[0].asNumber();
    // TODO: is it a bad idea to use new here? I'm never deleting => memory leak
    //auto functionPointer = new jsi::Value(std::move(arguments[1]));
    //auto& funcRef = arguments[1];
    auto functionPointer = new jsi::Value(runtime, arguments[1]);
    
    RCTExecuteOnMainQueue(^{
      auto currentBridge = [RCTBridge currentBridge];
      auto anonymousView = [currentBridge.uiManager viewForReactTag:[NSNumber numberWithDouble:viewTag]];
      auto view = static_cast<CameraView*>(anonymousView);
      
      if (view.frameProcessorDelegate == nil) {
        NSLog(@"FrameProcessorBindings: Initializing FrameProcessorDelegate...");
        view.frameProcessorDelegate = [[FrameProcessorDelegate alloc] initWithBridge:[RCTBridge currentBridge]];
      }
      
      [view.frameProcessorDelegate setFrameProcessorFunction:(void*)functionPointer];
      NSLog(@"FrameProcessorBindings: Frame processor set!");
    });

    return jsi::Value::undefined();
  };
  jsiRuntime.global().setProperty(jsiRuntime, "setFrameProcessor", jsi::Function::createFromHostFunction(jsiRuntime,
                                                                                                         jsi::PropNameID::forAscii(jsiRuntime, "setFrameProcessor"),
                                                                                                         2,  // viewTag, frameProcessor
                                                                                                         setFrameProcessor));

  // unsetFrameProcessor(viewTag: number)
  auto unsetFrameProcessor = [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
    NSLog(@"FrameProcessorBindings: Removing frame processor...");
    if (!arguments[0].isNumber()) throw jsi::JSError(runtime, "Camera::unsetFrameProcessor: First argument ('viewTag') must be a number!");
    auto viewTag = arguments[0].asNumber();

    RCTExecuteOnMainQueue(^{
      auto currentBridge = [RCTBridge currentBridge];
      auto anonymousView = [currentBridge.uiManager viewForReactTag:[NSNumber numberWithDouble:viewTag]];
      auto view = static_cast<CameraView*>(anonymousView);
      view.frameProcessorDelegate = nil;
      NSLog(@"FrameProcessorBindings: Frame processor removed!");
    });

    return jsi::Value::undefined();
  };
  jsiRuntime.global().setProperty(jsiRuntime, "unsetFrameProcessor", jsi::Function::createFromHostFunction(jsiRuntime,
                                                                                                           jsi::PropNameID::forAscii(jsiRuntime, "unsetFrameProcessor"),
                                                                                                           1,  // viewTag
                                                                                                           unsetFrameProcessor));
}

+ (void) uninstallFrameProcessorBindings {
  // TODO: Any cleanup?
}

@end
