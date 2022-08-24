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

FrameProcessorCallback convertJSIFunctionToFrameProcessorCallback(jsi::Runtime& runtime, const jsi::Function& value) {
  __block auto cb = value.getFunction(runtime);
  
  return ^(Frame* frame) {
    auto frameHostObject = std::make_shared<FrameHostObject>(frame);
    try {
      // Invoke the FP worklet and check if we got handed a Frame back to display
      auto frameProcessorResult = cb.callWithThis(runtime, cb, jsi::Object::createFromHostObject(runtime, frameHostObject));
      // Remove reference so frame can be dealloc'd
      frameHostObject->frame = nil;
      // If we didn't return a frame, fallback to original camera frame
      if (frameProcessorResult.isUndefined()) {
        return frame;
      }
      // Create host object from worklet result so we can get the Frame
      auto processedFrameHostObject = static_cast<FrameHostObject*>(frameProcessorResult.asObject(runtime).asHostObject(runtime).get());
      auto processedFrame = processedFrameHostObject->frame;
      // Remove reference so frame can be dealloc'd
      processedFrameHostObject->frame = nil;
      return processedFrame;
    } catch (jsi::JSError& jsError) {
      auto stack = std::regex_replace(jsError.getStack(), std::regex("\n"), "\n    ");
      auto message = [NSString stringWithFormat:@"Frame Processor threw an error: %s\nIn: %s", jsError.getMessage().c_str(), stack.c_str()];
      NSLog(@"%@", message);
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
    // Fallback to original camera frame
    frameHostObject->frame = nil;
    return frame;
  };
}
