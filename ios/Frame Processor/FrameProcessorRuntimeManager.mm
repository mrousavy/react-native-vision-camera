//
//  FrameProcessorRuntimeManager.m
//  VisionCamera
//
//  Created by Marc Rousavy on 23.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "FrameProcessorRuntimeManager.h"
#import "FrameProcessorPluginRegistry.h"
#import "FrameHostObject.h"

#import <memory>

#import <React/RCTBridge.h>
#import <ReactCommon/RCTTurboModule.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTUIManager.h>
#import <ReactCommon/RCTTurboModuleManager.h>

#import "JsiWorkletContext.h"
#import "JsiWorkletApi.h"
#import "JsiWorklet.h"

#import "FrameProcessorUtils.h"
#import "FrameProcessorCallback.h"
#import "../React Utils/JSIUtils.h"

// Forward declarations for the Swift classes
__attribute__((objc_runtime_name("_TtC12VisionCamera12CameraQueues")))
@interface CameraQueues : NSObject
@property (nonatomic, class, readonly, strong) dispatch_queue_t _Nonnull frameProcessorQueue;
@end
__attribute__((objc_runtime_name("_TtC12VisionCamera10CameraView")))
@interface CameraView : UIView
@property (nonatomic, copy) FrameProcessorCallback _Nullable frameProcessorCallback;
@end

@implementation FrameProcessorRuntimeManager {
  std::shared_ptr<RNWorklet::JsiWorkletContext> workletContext;
}

- (instancetype)init {
    if (self = [super init]) {
        // Initialize self
    }
    return self;
}

- (void) setupWorkletContext:(jsi::Runtime&)runtime {
  NSLog(@"FrameProcessorBindings: Creating Worklet Context...");

  auto callInvoker = RCTBridge.currentBridge.jsCallInvoker;

  auto runOnJS = [callInvoker](std::function<void()>&& f) {
    // Run on React JS Runtime
    callInvoker->invokeAsync(std::move(f));
  };
  auto runOnWorklet = [](std::function<void()>&& f) {
    // Run on Frame Processor Worklet Runtime
    dispatch_async(CameraQueues.frameProcessorQueue, [f = std::move(f)](){
      f();
    });
  };

  workletContext = std::make_shared<RNWorklet::JsiWorkletContext>("VisionCamera");
  workletContext->initialize("VisionCamera",
                             &runtime,
                             runOnJS,
                             runOnWorklet);

  NSLog(@"FrameProcessorBindings: Worklet Context Created!");

  NSLog(@"FrameProcessorBindings: Installing Frame Processor plugins...");

  jsi::Object frameProcessorPlugins(runtime);

  // Iterate through all registered plugins (+init)
  for (NSString* pluginKey in [FrameProcessorPluginRegistry frameProcessorPlugins]) {
    auto pluginName = [pluginKey UTF8String];

    NSLog(@"FrameProcessorBindings: Installing Frame Processor plugin \"%s\"...", pluginName);
    // Get the Plugin callback func
    FrameProcessorPlugin callback = [[FrameProcessorPluginRegistry frameProcessorPlugins] valueForKey:pluginKey];

    // Create the JSI host function
    auto function = [callback, callInvoker](jsi::Runtime& runtime,
                                            const jsi::Value& thisValue,
                                            const jsi::Value* arguments,
                                            size_t count) -> jsi::Value {
      // Get the first parameter, which is always the native Frame Host Object.
      auto frameHostObject = arguments[0].asObject(runtime).asHostObject(runtime);
      auto frame = static_cast<FrameHostObject*>(frameHostObject.get());

      // Convert any additional parameters to the Frame Processor to ObjC objects
      auto args = convertJSICStyleArrayToNSArray(runtime,
                                                 arguments + 1, // start at index 1 since first arg = Frame
                                                 count - 1, // use smaller count
                                                 callInvoker);
      // Call the FP Plugin, which might return something.
      id result = callback(frame->frame, args);

      // Convert the return value (or null) to a JS Value and return it to JS
      return convertObjCObjectToJSIValue(runtime, result);
    };

    // Assign it to the Proxy.
    // A FP Plugin called "example_plugin" can be now called from JS using "FrameProcessorPlugins.example_plugin(frame)"
    frameProcessorPlugins.setProperty(runtime,
                                      pluginName,
                                      jsi::Function::createFromHostFunction(runtime,
                                                                            jsi::PropNameID::forAscii(runtime, pluginName),
                                                                            1, // frame
                                                                            function));
  }

  // global.FrameProcessorPlugins Proxy
  runtime.global().setProperty(runtime, "FrameProcessorPlugins", frameProcessorPlugins);

  NSLog(@"FrameProcessorBindings: Frame Processor plugins installed!");
}

- (void) installFrameProcessorBindings {
  NSLog(@"FrameProcessorBindings: Installing Frame Processor Bindings for Bridge...");
  RCTCxxBridge *cxxBridge = (RCTCxxBridge *)[RCTBridge currentBridge];
  if (!cxxBridge.runtime) {
    return;
  }

  jsi::Runtime& jsiRuntime = *(jsi::Runtime*)cxxBridge.runtime;

  // Install the Worklet Runtime in the main React JS Runtime
  [self setupWorkletContext:jsiRuntime];

  NSLog(@"FrameProcessorBindings: Installing global functions...");

  // setFrameProcessor(viewTag: number, frameProcessor: (frame: Frame) => void)
  auto setFrameProcessor = [self](jsi::Runtime& runtime,
                                  const jsi::Value& thisValue,
                                  const jsi::Value* arguments,
                                  size_t count) -> jsi::Value {
    NSLog(@"FrameProcessorBindings: Setting new frame processor...");
    if (!arguments[0].isNumber()) throw jsi::JSError(runtime, "Camera::setFrameProcessor: First argument ('viewTag') must be a number!");
    if (!arguments[1].isObject()) throw jsi::JSError(runtime, "Camera::setFrameProcessor: Second argument ('frameProcessor') must be a function!");

    auto viewTag = arguments[0].asNumber();
    NSLog(@"FrameProcessorBindings: Converting JSI Function to Worklet...");
    auto worklet = std::make_shared<RNWorklet::JsiWorklet>(runtime, arguments[1]);

    RCTExecuteOnMainQueue([=]() {
      auto currentBridge = [RCTBridge currentBridge];
      auto anonymousView = [currentBridge.uiManager viewForReactTag:[NSNumber numberWithDouble:viewTag]];
      auto view = static_cast<CameraView*>(anonymousView);

      NSLog(@"FrameProcessorBindings: Converting worklet to Objective-C callback...");

      view.frameProcessorCallback = convertWorkletToFrameProcessorCallback(workletContext->getWorkletRuntime(), worklet);

      NSLog(@"FrameProcessorBindings: Frame processor set!");
    });

    return jsi::Value::undefined();
  };
  jsiRuntime.global().setProperty(jsiRuntime, "setFrameProcessor", jsi::Function::createFromHostFunction(jsiRuntime,
                                                                                                         jsi::PropNameID::forAscii(jsiRuntime, "setFrameProcessor"),
                                                                                                         2,  // viewTag, frameProcessor
                                                                                                         setFrameProcessor));

  // unsetFrameProcessor(viewTag: number)
  auto unsetFrameProcessor = [](jsi::Runtime& runtime,
                                const jsi::Value& thisValue,
                                const jsi::Value* arguments,
                                size_t count) -> jsi::Value {
    NSLog(@"FrameProcessorBindings: Removing frame processor...");
    if (!arguments[0].isNumber()) throw jsi::JSError(runtime, "Camera::unsetFrameProcessor: First argument ('viewTag') must be a number!");
    auto viewTag = arguments[0].asNumber();

    RCTExecuteOnMainQueue(^{
      auto currentBridge = [RCTBridge currentBridge];
      if (!currentBridge) return;

      auto anonymousView = [currentBridge.uiManager viewForReactTag:[NSNumber numberWithDouble:viewTag]];
      if (!anonymousView) return;

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

  NSLog(@"FrameProcessorBindings: Finished installing bindings.");
}

@end
