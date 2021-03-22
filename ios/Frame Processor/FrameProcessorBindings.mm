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
#import <ReactCommon/RCTTurboModuleManager.h>

#import <jsi/jsi.h>
#import "FrameProcessorUtils.h"
#import "../../cpp/MakeJSIRuntime.h"
#import "FrameProcessorDelegate.h"

#if __has_include("VisionCamera-Swift.h")
#import "VisionCamera-Swift.h"
#else
#error Objective-C Generated Interface Header (VisionCamera-Swift.h) was not found!
#endif

#if !__has_include(<RNReanimated/NativeReanimatedModule.h>)
#error The NativeReanimatedModule.h header could not be found, make sure you install react-native-reanimated!
#endif

#import <RNReanimated/NativeReanimatedModule.h>
#import <RNReanimated/RuntimeManager.h>
#import <RNReanimated/ShareableValue.h>
#import <RNReanimated/RuntimeDecorator.h>
#import <RNReanimated/REAIOSErrorHandler.h>
#import <RNReanimated/REAIOSScheduler.h>
#import <memory>

using namespace facebook;

@implementation FrameProcessorBindings

static std::unique_ptr<reanimated::RuntimeManager> runtimeManager;
static dispatch_queue_t dispatchQueue = CameraQueues.videoQueue;

+ (void) installFrameProcessorBindings:(RCTBridge*)bridge {
  NSLog(@"FrameProcessorBindings: Installing Frame Processor Bindings...");
  RCTCxxBridge *cxxBridge = (RCTCxxBridge *)bridge;
  if (!cxxBridge.runtime) {
    return;
  }
  jsi::Runtime& jsiRuntime = *(jsi::Runtime*)cxxBridge.runtime;
  
  NSLog(@"FrameProcessorBindings: Creating Runtime Manager...");
  
  auto callInvoker = bridge.jsCallInvoker;
  dispatch_async(dispatchQueue, [callInvoker]() -> void {
    NSLog(@"FrameProcessorBindings: Creating Runtime Manager on DispatchQueue %s...", dispatch_queue_get_label(DISPATCH_CURRENT_QUEUE_LABEL));
    auto runtime = vision::makeJSIRuntime();
    reanimated::RuntimeDecorator::decorateRuntime(*runtime, "FRAME_PROCESSOR");
    runtime->global().setProperty(*runtime, "_FRAME_PROCESSOR", jsi::Value(true));
    auto scheduler = std::make_shared<reanimated::REAIOSScheduler>(callInvoker);
    runtimeManager = std::make_unique<reanimated::RuntimeManager>(std::move(runtime),
                                                                  std::make_shared<reanimated::REAIOSErrorHandler>(scheduler),
                                                                  scheduler);
    NSLog(@"FrameProcessorBindings: Runtime Manager created!");
  });
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
      
      dispatch_async(dispatchQueue, [worklet, view]() -> void {
        NSLog(@"FrameProcessorBindings: Converting worklet to Objective-C callback...");
        auto& rt = *runtimeManager->runtime;
        auto function = worklet->getValue(rt).asObject(rt).asFunction(rt);
        auto callback = convertJSIFunctionToFrameProcessorCallback(rt, function);
        view.frameProcessorCallback = callback;
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
  runtimeManager.reset();
}

@end
