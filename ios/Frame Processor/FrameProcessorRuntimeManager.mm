//
//  FrameProcessorRuntimeManager.m
//  VisionCamera
//
//  Created by Marc Rousavy on 23.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import "FrameProcessorRuntimeManager.h"
#import "../../cpp/MakeJSIRuntime.h"

#if __has_include("VisionCamera-Swift.h")
#import "VisionCamera-Swift.h"
#else
#error Objective-C Generated Interface Header (VisionCamera-Swift.h) was not found!
#endif

#import <Foundation/Foundation.h>

#import <React/RCTBridge.h>
#import <ReactCommon/RCTTurboModule.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTUIManager.h>
#import <ReactCommon/RCTTurboModuleManager.h>

#if __has_include(<RNReanimated/NativeReanimatedModule.h>)
#import <RNReanimated/RuntimeManager.h>
#import <RNReanimated/RuntimeDecorator.h>
#import <RNReanimated/REAIOSScheduler.h>
#import <RNReanimated/REAIOSErrorHandler.h>
#else
#error The NativeReanimatedModule.h header could not be found, make sure you install react-native-reanimated!
#endif

#import <memory>

@implementation FrameProcessorRuntimeManager {
  std::unique_ptr<reanimated::RuntimeManager> runtimeManager;
  __weak RCTBridge* weakBridge;
}

- (instancetype) initWithBridge:(RCTBridge*)bridge {
  self = [super init];
  if (self) {
    NSLog(@"FrameProcessorBindings: Creating Runtime Manager...");
    weakBridge = bridge;
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

- (void) installFrameProcessorBindingsImpl:(RCTBridge*)bridge {
  NSLog(@"FrameProcessorBindings: Installing Frame Processor Bindings for Bridge...");
  RCTCxxBridge *cxxBridge = (RCTCxxBridge *)weakBridge;
  if (!cxxBridge.runtime) {
    return;
  }
  jsi::Runtime& jsiRuntime = *(jsi::Runtime*)cxxBridge.runtime;
  
  NSLog(@"FrameProcessorBindings: Installing global functions...");
  
  // setFrameProcessor(viewTag: number, frameProcessor: (frame: Frame) => void)
  auto setFrameProcessor = [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
    NSLog(@"FrameProcessorBindings: Setting new frame processor...");
    if (!arguments[0].isNumber()) throw jsi::JSError(runtime, "Camera::setFrameProcessor: First argument ('viewTag') must be a number!");
    if (!arguments[1].isObject()) throw jsi::JSError(runtime, "Camera::setFrameProcessor: Second argument ('frameProcessor') must be a function!");
    if (!runtimeManager || !runtimeManager->runtime) throw jsi::JSError(runtime, "Camera::setFrameProcessor: The RuntimeManager is not yet initialized!");
    
    auto viewTag = arguments[0].asNumber();
    NSLog(@"FrameProcessorBindings: Adapting Shareable value from function (conversion to worklet)...");
    auto worklet = reanimated::ShareableValue::adapt(runtime, arguments[1], runtimeManager.get());
    NSLog(@"FrameProcessorBindings: Successfully created worklet!");
    
    RCTExecuteOnMainQueue([worklet, viewTag]() -> void {
      auto currentBridge = [RCTBridge currentBridge];
      auto anonymousView = [currentBridge.uiManager viewForReactTag:[NSNumber numberWithDouble:viewTag]];
      auto view = static_cast<CameraView*>(anonymousView);
      
      dispatch_async(CameraQueues.videoQueue, [worklet, view]() -> void {
        NSLog(@"FrameProcessorBindings: Converting worklet to Objective-C callback...");
        auto& rt = *runtimeManager->runtime;
        auto function = worklet->getValue(rt).asObject(rt).asFunction(rt);
        view.frameProcessorCallback = convertJSIFunctionToFrameProcessorCallback(rt, function);
        NSLog(@"FrameProcessorBindings: Frame processor set!");
      });
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
      view.frameProcessorCallback = nil;
      NSLog(@"FrameProcessorBindings: Frame processor removed!");
    });
    
    return jsi::Value::undefined();
  };
  jsiRuntime.global().setProperty(jsiRuntime, "unsetFrameProcessor", jsi::Function::createFromHostFunction(jsiRuntime,
                                                                                                           jsi::PropNameID::forAscii(jsiRuntime, "unsetFrameProcessor"),
                                                                                                           1,  // viewTag
                                                                                                           unsetFrameProcessor));
}

- (void) installFrameProcessorBindings {
  if (!weakBridge) {
    NSLog(@"FrameProcessorBindings: Failed to install Frame Processor Bindings - bridge was null!");
    return;
  }
  weakBridge.jsCallInvoker->runOnJSQueueThread(^{
    self.installFrameProcessorBindingsImpl:weakBridge;
  });
}

@end
