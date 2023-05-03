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

#import "WKTJsiWorklet.h"

#import "RNSkPlatformContext.h"
#import "RNSkiOSPlatformContext.h"
#import "JsiSkCanvas.h"

FrameProcessorCallback convertWorkletToFrameProcessorCallback(jsi::Runtime& runtime, std::shared_ptr<RNWorklet::JsiWorklet> worklet) {
  // Wrap Worklet call in invoker
  auto workletInvoker = std::make_shared<RNWorklet::WorkletInvoker>(worklet);
  // Create cached Skia Canvas object
  auto callInvoker = RCTBridge.currentBridge.jsCallInvoker;
  auto skiaPlatformContext = std::make_shared<RNSkia::RNSkiOSPlatformContext>(&runtime, callInvoker, [](std::function<void()>) {
    // TODO: dispatch on main thread is stubbed for now :/
  }, [](size_t viewTag) {
    // TODO: screenshot is stubbed for now :/
    return sk_sp<SkImage>(nullptr);
  });
  auto canvasHostObject = std::make_shared<RNSkia::JsiSkCanvas>(skiaPlatformContext);

  // Converts a Worklet to a callable Objective-C block function
  return ^(Frame* frame, void* skiaCanvas) {

    try {
        // create HostObject which holds the Frame
      auto frameHostObject = std::make_shared<FrameHostObject>(frame);
      // Update cached Canvas object
      if (skiaCanvas != nullptr) {
        canvasHostObject->setCanvas((SkCanvas*)skiaCanvas);
        frameHostObject->canvas = canvasHostObject;
      } else {
        frameHostObject->canvas = nullptr;
      }

      auto argument = jsi::Object::createFromHostObject(runtime, frameHostObject);
      jsi::Value jsValue(std::move(argument));
      // Call the Worklet with the Frame JS Host Object as an argument
      workletInvoker->call(runtime, jsi::Value::undefined(), &jsValue, 1);

      // After the sync Frame Processor finished executing, remove the Canvas on that Frame instance. It can no longer draw.
      frameHostObject->canvas = nullptr;
    } catch (jsi::JSError& jsError) {
      // JS Error occured, print it to console.
      auto stack = std::regex_replace(jsError.getStack(), std::regex("\n"), "\n    ");
      auto message = [NSString stringWithFormat:@"Frame Processor threw an error: %s\nIn: %s", jsError.getMessage().c_str(), stack.c_str()];

      RCTBridge* bridge = [RCTBridge currentBridge];
      if (bridge != nil && bridge.jsCallInvoker != nullptr) {
        bridge.jsCallInvoker->invokeAsync([bridge, message]() {
          auto logFn = [JSConsoleHelper getLogFunctionForBridge:bridge];
          logFn(RCTLogLevelError, message);
        });
      } else {
        NSLog(@"%@", message);
      }
    }
  };
}
