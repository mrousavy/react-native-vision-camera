//
//  FrameProcessorUtils.m
//  VisionCamera
//
//  Created by Marc Rousavy on 15.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#import "FrameProcessorUtils.h"
#import <chrono>
#import <memory>
#import <regex>

#import "FrameHostObject.h"
#import "Frame.h"

#import <React/RCTBridge.h>
#import <React/RCTBridge+Private.h>
#import "JSConsoleHelper.h"
#import <ReactCommon/RCTTurboModule.h>

#import "RNSkPlatformContext.h"
#import "RNSkiOSPlatformContext.h"
#import "../Skia Render Layer/SkImageHelpers.h"
#import <JsiSkCanvas.h>

#import <react-native-worklets/cpp/JsiWorklet.h>

FrameProcessorCallback convertJSIFunctionToFrameProcessorCallback(jsi::Runtime& runtime,
                                                                  std::shared_ptr<RNWorklet::JsiWorklet> worklet) {
  std::shared_ptr<RNSkia::RNSkPlatformContext> platformContext = std::make_shared<RNSkia::RNSkiOSPlatformContext>(&runtime, RCTBridge.currentBridge.jsCallInvoker);
  
  auto canvasHostObject = std::make_shared<RNSkia::JsiSkCanvas>(platformContext);
  
  return ^(Frame* frame, void* skCanvas, void* imageHelpers) {
    canvasHostObject->setCanvas((SkCanvas*)skCanvas);
    auto frameHostObject = std::make_shared<FrameHostObject>(frame, canvasHostObject, (SkImageHelpers*)imageHelpers);
    try {
      auto object = jsi::Object::createFromHostObject(runtime, frameHostObject);
      jsi::Value val(std::move(object));
      worklet->callInWorkletContext(runtime,
                                    jsi::Value::undefined(),
                                    &val,
                                    1);
    } catch (jsi::JSError& jsError) {
      auto stack = std::regex_replace(jsError.getStack(), std::regex("\n"), "\n    ");
      auto message = [NSString stringWithFormat:@"Frame Processor threw an error: %s\nIn: %s", jsError.getMessage().c_str(), stack.c_str()];
      
      RCTBridge* bridge = [RCTBridge currentBridge];
      if (bridge != nil) {
        bridge.jsCallInvoker->invokeAsync([bridge, message]() {
          auto logFn = [JSConsoleHelper getLogFunctionForBridge:bridge];
          logFn(RCTLogLevelError, message);
        });
      } else {
        NSLog(@"%@", message);
      }
    }

    // Manually free the buffer because:
    //  1. we are sure we don't need it anymore, the frame processor worklet has finished executing.
    //  2. we don't know when the JS runtime garbage collects this object, it might be holding it for a few more frames
    //     which then blocks the camera queue from pushing new frames (memory limit)
    frameHostObject->close();
  };
}
