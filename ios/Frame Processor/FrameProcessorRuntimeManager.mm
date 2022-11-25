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


#import <react-native-worklets/cpp/JsiWorklet.h>
#import <react-native-worklets/cpp/JsiWorkletApi.h>
#import <react-native-worklets/cpp/JsiWorkletContext.h>

#import "FrameProcessorUtils.h"
#import "FrameProcessorCallback.h"
#import "../React Utils/MakeJSIRuntime.h"
#import "../React Utils/JSIUtils.h"
#import <JsiSkApi.h>
#import <RNSkiOSPlatformContext.h>

#define ENABLE_FRAME_PROCESSORS true

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

- (instancetype) initWithBridge:(RCTBridge*)bridge {
  self = [super init];
  if (self) {
    // init self idk
  }
  return self;
}

- (void) setupWorkletContext:(jsi::Runtime&)runtime {
  NSLog(@"FrameProcessorBindings: Creating Worklet Context...");

  auto callInvoker = RCTBridge.currentBridge.jsCallInvoker;
  auto errorHandler = std::make_shared<std::function<void(const std::exception &ex)>>([](const std::exception &err) {
    RCTFatal(RCTErrorWithMessage([NSString stringWithUTF8String:err.what()]));
  });
  workletContext = std::make_shared<RNWorklet::JsiWorkletContext>("VisionCamera",
                                                                  &runtime,
                                                                  callInvoker,
                                                                  errorHandler);
  RNWorklet::JsiWorkletApi::installApi(workletContext);
  
  
  NSLog(@"FrameProcessorBindings: Worklet Context Created!");
  
  workletContext->runOnWorkletThread([=]() {
    auto& workletRuntime = workletContext->getWorkletRuntime();
    
    workletRuntime.global().setProperty(workletRuntime, "_FRAME_PROCESSOR", jsi::Value(true));
    
    // Install Skia
    jsi::Runtime* rrr = &workletRuntime;
    auto platformContext = std::make_shared<RNSkia::RNSkiOSPlatformContext>(rrr, callInvoker);
    auto skiaApi = std::make_shared<RNSkia::JsiSkApi>(workletRuntime, platformContext);
    workletRuntime.global().setProperty(workletRuntime,
                                        "SkiaApi",
                                        jsi::Object::createFromHostObject(workletRuntime, std::move(skiaApi)));

    NSLog(@"FrameProcessorBindings: Installing Frame Processor plugins...");
    
    auto& visionRuntime = workletContext->getWorkletRuntime();
    auto visionGlobal = visionRuntime.global();

    for (NSString* pluginKey in [FrameProcessorPluginRegistry frameProcessorPlugins]) {
      auto pluginName = [pluginKey UTF8String];

      NSLog(@"FrameProcessorBindings: Installing Frame Processor plugin \"%s\"...", pluginName);
      FrameProcessorPlugin callback = [[FrameProcessorPluginRegistry frameProcessorPlugins] valueForKey:pluginKey];

      auto function = [callback, callInvoker](jsi::Runtime& runtime,
                                              const jsi::Value& thisValue,
                                              const jsi::Value* arguments,
                                              size_t count) -> jsi::Value {
        auto frameHostObject = arguments[0].asObject(runtime).asHostObject(runtime);
        auto frame = static_cast<FrameHostObject*>(frameHostObject.get());

        auto args = convertJSICStyleArrayToNSArray(runtime,
                                                   arguments + 1, // start at index 1 since first arg = Frame
                                                   count - 1, // use smaller count
                                                   callInvoker);
        id result = callback(frame->frame, args);

        return convertObjCObjectToJSIValue(runtime, result);
      };

      visionGlobal.setProperty(visionRuntime, pluginName, jsi::Function::createFromHostFunction(visionRuntime,
                                                                                                jsi::PropNameID::forAscii(visionRuntime, pluginName),
                                                                                                1, // frame
                                                                                                function));
    }

    NSLog(@"FrameProcessorBindings: Frame Processor plugins installed!");
  });
}

- (void) installFrameProcessorBindings {
  RCTBridge* bridge = RCTBridge.currentBridge;
  if (bridge == nil) {
    NSLog(@"FrameProcessorBindings: Failed to install Frame Processor Bindings - bridge was null!");
    return;
  }

  NSLog(@"FrameProcessorBindings: Installing Frame Processor Bindings for Bridge...");
  RCTCxxBridge *cxxBridge = (RCTCxxBridge *)bridge;
  if (!cxxBridge.runtime) {
    return;
  }
  
  jsi::Runtime& jsiRuntime = *(jsi::Runtime*)cxxBridge.runtime;
  
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
    if (!arguments[2].isObject()) throw jsi::JSError(runtime, "Camera::setFrameProcessor: Third argument ('workletCaptures') must be an object!");

    auto viewTag = arguments[0].asNumber();
    NSLog(@"FrameProcessorBindings: Adapting Shareable value from function (conversion to worklet)...");
    auto worklet = std::make_shared<RNWorklet::JsiWorklet>(workletContext, runtime, arguments[1], arguments[2]);
    NSLog(@"FrameProcessorBindings: Successfully created worklet!");
    
    RCTExecuteOnMainQueue([=]() {
      auto currentBridge = [RCTBridge currentBridge];
      auto anonymousView = [currentBridge.uiManager viewForReactTag:[NSNumber numberWithDouble:viewTag]];
      auto view = static_cast<CameraView*>(anonymousView);

      dispatch_async(CameraQueues.frameProcessorQueue, [=]() {
        NSLog(@"FrameProcessorBindings: Converting worklet to Objective-C callback...");

        auto* jsRuntime = workletContext->getJsRuntime();
        view.frameProcessorCallback = convertJSIFunctionToFrameProcessorCallback(*jsRuntime, worklet);
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
