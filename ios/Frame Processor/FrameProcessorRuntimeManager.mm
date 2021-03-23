//
//  FrameProcessorRuntimeManager.m
//  VisionCamera
//
//  Created by Marc Rousavy on 23.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import "FrameProcessorRuntimeManager.h"
#import "../../cpp/MakeJSIRuntime.h"

#import <Foundation/Foundation.h>

#import <React/RCTBridge.h>
#import <ReactCommon/RCTTurboModule.h>

#import <RNReanimated/RuntimeManager.h>
#import <RNReanimated/RuntimeDecorator.h>
#import <RNReanimated/REAIOSScheduler.h>
#import <RNReanimated/REAIOSErrorHandler.h>

#import <memory>

@implementation FrameProcessorRuntimeManager {
  std::unique_ptr<reanimated::RuntimeManager> runtimeManager;
}

- (instancetype) initWithBridge:(RCTBridge*)bridge {
  self = [super init];
  if (self) {
    NSLog(@"FrameProcessorBindings: Creating Runtime Manager...");
    auto runtime = vision::makeJSIRuntime();
    reanimated::RuntimeDecorator::decorateRuntime(*runtime, "FRAME_PROCESSOR");
    runtime->global().setProperty(*runtime, "_FRAME_PROCESSOR", jsi::Value(true));
    auto scheduler = std::make_shared<reanimated::REAIOSScheduler>(bridge.jsCallInvoker);
    runtimeManager = std::make_unique<reanimated::RuntimeManager>(std::move(runtime),
                                                                  std::make_shared<reanimated::REAIOSErrorHandler>(scheduler),
                                                                  scheduler);
    NSLog(@"FrameProcessorBindings: Runtime Manager created!");
  }
  return self;
}

@end
