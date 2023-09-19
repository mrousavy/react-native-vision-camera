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

#ifndef VISION_CAMERA_DISABLE_FRAME_PROCESSORS
  #if __has_include(<RNReanimated/NativeReanimatedModule.h>)
    #if __has_include(<RNReanimated/WorkletRuntime.h>)
      #import <RNReanimated/WorkletRuntime.h>
      #import "VisionCameraScheduler.h"
      #define ENABLE_FRAME_PROCESSORS
    #else
      #warning Your react-native-reanimated version is not compatible with VisionCamera, Frame Processors are disabled. Make sure you're using react-native-reanimated 3.5.0 or above!
    #endif
  #else
    #warning NativeReanimatedModule.h header could not be found, Frame Processors are disabled. If you want to use Frame Processors, make sure you install react-native-reanimated 3.5.0 or above!
  #endif
#endif

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
#ifdef ENABLE_FRAME_PROCESSORS
  std::shared_ptr<reanimated::WorkletRuntime> workletRuntime;
#endif
  __weak RCTBridge* weakBridge;
}

- (instancetype) initWithBridge:(RCTBridge*)bridge {
  self = [super init];
  if (self) {
#ifdef ENABLE_FRAME_PROCESSORS
    NSLog(@"FrameProcessorBindings: Creating Runtime Manager...");
    weakBridge = bridge;
    NSLog(@"FrameProcessorBindings: Frame Processor plugins installed!");
#else
    NSLog(@"Reanimated not found, Frame Processors are disabled.");
#endif
  }
  return self;
}

- (void) installFrameProcessorBindings {
#ifdef ENABLE_FRAME_PROCESSORS
  if (!weakBridge) {
    NSLog(@"FrameProcessorBindings: Failed to install Frame Processor Bindings - bridge was null!");
    return;
  }

  NSLog(@"FrameProcessorBindings: Installing Frame Processor Bindings for Bridge...");
  RCTCxxBridge *cxxBridge = (RCTCxxBridge *)weakBridge;
  if (!cxxBridge.runtime) {
    return;
  }

  jsi::Runtime& jsiRuntime = *(jsi::Runtime*)cxxBridge.runtime;
  NSLog(@"FrameProcessorBindings: Installing global functions...");

  // setFrameProcessor(viewTag: number, frameProcessor: (frame: Frame) => void)
  auto setFrameProcessor = [self](jsi::Runtime& rnRuntime,
                                  const jsi::Value& thisValue,
                                  const jsi::Value* arguments,
                                  size_t count) -> jsi::Value {
    self->workletRuntime = reanimated::extractWorkletRuntime(rnRuntime, arguments[2].asObject(rnRuntime));
    jsi::Runtime &visionRuntime = self->workletRuntime->getJSIRuntime();

    // TODO: call reanimated::RuntimeDecorator::decorateRuntime(*runtime, "FRAME_PROCESSOR");
    visionRuntime.global().setProperty(visionRuntime, "_FRAME_PROCESSOR", jsi::Value(true));

    for (NSString* pluginKey in [FrameProcessorPluginRegistry frameProcessorPlugins]) {
      auto pluginName = [pluginKey UTF8String];

      NSLog(@"FrameProcessorBindings: Installing Frame Processor plugin \"%s\"...", pluginName);
      FrameProcessorPlugin callback = [[FrameProcessorPluginRegistry frameProcessorPlugins] valueForKey:pluginKey];

      auto function = [callback](jsi::Runtime& runtime,
                                              const jsi::Value& thisValue,
                                              const jsi::Value* arguments,
                                              size_t count) -> jsi::Value {
        auto frameHostObject = arguments[0].asObject(runtime).asHostObject(runtime);
        auto frame = static_cast<FrameHostObject*>(frameHostObject.get());

        auto args = convertJSICStyleArrayToNSArray(runtime,
                                                   arguments + 1, // start at index 1 since first arg = Frame
                                                   count - 1, // use smaller count
                                                   nullptr);
        id result = callback(frame->frame, args);

        return convertObjCObjectToJSIValue(runtime, result);
      };

      visionRuntime.global().setProperty(visionRuntime, pluginName, jsi::Function::createFromHostFunction(visionRuntime,
                                                                                                jsi::PropNameID::forAscii(visionRuntime, pluginName),
                                                                                                1, // frame
                                                                                                function));
    }

    NSLog(@"FrameProcessorBindings: Setting new frame processor...");
    if (!arguments[0].isNumber()) throw jsi::JSError(rnRuntime, "Camera::setFrameProcessor: First argument ('viewTag') must be a number!");
    if (!arguments[1].isObject()) throw jsi::JSError(rnRuntime, "Camera::setFrameProcessor: Second argument ('frameProcessor') must be a function!");

    auto viewTag = arguments[0].asNumber();
    NSLog(@"FrameProcessorBindings: Adapting Shareable value from function (conversion to worklet)...");

    auto worklet = reanimated::extractShareableOrThrow<reanimated::ShareableWorklet>(rnRuntime, arguments[1].asObject(rnRuntime));
    NSLog(@"FrameProcessorBindings: Successfully created worklet!");

    RCTExecuteOnMainQueue([=]() {
      auto currentBridge = [RCTBridge currentBridge];
      auto anonymousView = [currentBridge.uiManager viewForReactTag:[NSNumber numberWithDouble:viewTag]];
      auto view = static_cast<CameraView*>(anonymousView);

      dispatch_async(CameraQueues.frameProcessorQueue, [=]() {
        NSLog(@"FrameProcessorBindings: Converting worklet to Objective-C callback...");

        std::weak_ptr<reanimated::WorkletRuntime> weakWorkletRuntime = workletRuntime;
        std::weak_ptr<reanimated::ShareableWorklet> weakShareableWorklet = worklet;

        view.frameProcessorCallback = ^(Frame* frame) {
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
#endif
}

@end
