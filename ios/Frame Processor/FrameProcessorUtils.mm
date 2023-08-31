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

#import <RNReanimated/WorkletRuntime.h>
#import <RNReanimated/Shareables.h>

FrameProcessorCallback convertReanimatedWorkletToFrameProcessorCallback(
    const std::shared_ptr<reanimated::WorkletRuntime> &workletRuntime,
    const std::shared_ptr<reanimated::ShareableWorklet> &shareableWorklet) {
  std::weak_ptr<reanimated::WorkletRuntime> weakWorkletRuntime = workletRuntime;
  std::weak_ptr<reanimated::ShareableWorklet> weakShareableWorklet = shareableWorklet;
    
  return ^(Frame* frame) {
    auto workletRuntime = weakWorkletRuntime.lock();
    auto shareableWorklet = weakShareableWorklet.lock();
    if (workletRuntime == nullptr || shareableWorklet == nullptr) {
      return;
    }

    auto frameHostObject = std::make_shared<FrameHostObject>(frame);
    jsi::Runtime &runtime = workletRuntime->getJSIRuntime();
    auto hostObject = jsi::Object::createFromHostObject(runtime, frameHostObject);
    workletRuntime->runGuarded(shareableWorklet, hostObject);

    // Manually free the buffer because:
    //  1. we are sure we don't need it anymore, the frame processor worklet has finished executing.
    //  2. we don't know when the JS runtime garbage collects this object, it might be holding it for a few more frames
    //     which then blocks the camera queue from pushing new frames (memory limit)
    frameHostObject->close();
  };
}
