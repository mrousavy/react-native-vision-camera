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
#import "../React Utils/RCTBridge+runOnJS.h"

FrameProcessorCallback convertJSIFunctionToFrameProcessorCallback(jsi::Runtime& runtime) {
  return ^(Frame* frame) {

    auto frameHostObject = std::make_shared<FrameHostObject>(frame);
    try {
      [[RCTBridge currentBridge] runOnJS:^{
        auto fffff = runtime.global().getPropertyAsFunction(runtime, "hackyCallback");
        fffff.callWithThis(runtime, fffff, jsi::Object::createFromHostObject(runtime, frameHostObject));
      }];
       
      
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

    // without this, this is gonna be a memory leak.
    // frameHostObject->close();
  };
}
