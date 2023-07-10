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
    #if __has_include(<RNReanimated/RuntimeManager.h>)
      #import <RNReanimated/RuntimeManager.h>
      #import <RNReanimated/RuntimeDecorator.h>
      #import <RNReanimated/REAIOSErrorHandler.h>
      #import <RNReanimated/Shareables.h>
      #import <RNReanimated/JsiUtils.h>
      #import "VisionCameraScheduler.h"
      #define ENABLE_FRAME_PROCESSORS
    #else
      #warning Your react-native-reanimated version is not compatible with VisionCamera, Frame Processors are disabled. Make sure you're using reanimated 2.2.0 or above!
    #endif
  #else
    #warning The NativeReanimatedModule.h header could not be found, Frame Processors are disabled. If you want to use Frame Processors, make sure you install react-native-reanimated!
  #endif
#endif

#import "FrameProcessorUtils.h"
#import "FrameProcessorCallback.h"
#import "../React Utils/MakeJSIRuntime.h"
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
  std::unique_ptr<reanimated::RuntimeManager> runtimeManager;
  std::shared_ptr<reanimated::JSRuntimeHelper> runtimeHelper;
#endif
  __weak RCTBridge* weakBridge;
}

- (instancetype) initWithBridge:(RCTBridge*)bridge {
  self = [super init];
  if (self) {
#ifdef ENABLE_FRAME_PROCESSORS
    NSLog(@"FrameProcessorBindings: Creating Runtime Manager...");
    weakBridge = bridge;

    auto runtime = vision::makeJSIRuntime();
    reanimated::RuntimeDecorator::decorateRuntime(*runtime, "FRAME_PROCESSOR");
    runtime->global().setProperty(*runtime, "_FRAME_PROCESSOR", jsi::Value(true));

    auto callInvoker = bridge.jsCallInvoker;
    auto scheduler = std::make_shared<vision::VisionCameraScheduler>(callInvoker);
    runtimeManager = std::make_unique<reanimated::RuntimeManager>(std::move(runtime),
                                                                  std::make_shared<reanimated::REAIOSErrorHandler>(scheduler),
                                                                  scheduler);
    
    NSLog(@"FrameProcessorBindings: Runtime Manager created!");

    NSLog(@"FrameProcessorBindings: Installing Frame Processor plugins...");
    auto& visionRuntime = *runtimeManager->runtime;
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
  
  if (!runtimeManager) {
    throw std::runtime_error("Runtime Manager cannot be null!");
  }
  runtimeHelper = std::make_shared<reanimated::JSRuntimeHelper>(&jsiRuntime,
//                                                                runtimeManager->runtime.get(),
                                                                runtimeManager->scheduler);
    auto scheduler = runtimeManager->scheduler;
    
  // inject _scheduleOnJS
    auto scheduleOnJS = [scheduler, &jsiRuntime](
                            jsi::Runtime &rt,
                            const jsi::Value &remoteFun,
                            const jsi::Value &argsValue) {
      auto shareableRemoteFun = reanimated::extractShareableOrThrow<reanimated::ShareableRemoteFunction>(
          rt,
          remoteFun,
          "Incompatible object passed to scheduleOnJS. It is only allowed to schedule functions defined on the React Native JS runtime this way.");
      auto shareableArgs = argsValue.isUndefined()
          ? nullptr
          : reanimated::extractShareableOrThrow(rt, argsValue);
    scheduler->scheduleOnJS([=, &jsiRuntime] {
        jsi::Runtime &rt = jsiRuntime;
        auto remoteFun = shareableRemoteFun->getJSValue(rt);
        if (shareableArgs == nullptr) {
          // fast path for remote function w/o arguments
          remoteFun.asObject(rt).asFunction(rt).call(rt);
        } else {
          auto argsArray = shareableArgs->getJSValue(rt).asObject(rt).asArray(rt);
          auto argsSize = argsArray.size(rt);
          // number of arguments is typically relatively small so it is ok to
          // to use VLAs here, hence disabling the lint rule
          jsi::Value args[argsSize]; // NOLINT(runtime/arrays)
          for (size_t i = 0; i < argsSize; i++) {
            args[i] = argsArray.getValueAtIndex(rt, i);
          }
          remoteFun.asObject(rt).asFunction(rt).call(rt, args, argsSize);
        }
      });
    };
    reanimated::jsi_utils::installJsiFunction(*runtimeManager->runtime, "_scheduleOnJS", scheduleOnJS);

    auto rh = runtimeHelper;
    auto makeShareableClone = [rh](jsi::Runtime &rt, const jsi::Value &value) {
      auto &runtimeHelper = rh;
      auto shouldRetainRemote = jsi::Value::undefined();
      std::shared_ptr<reanimated::Shareable> shareable;
      if (value.isObject()) {
        auto object = value.asObject(rt);
        if (!object.getProperty(rt, "__workletHash").isUndefined()) {
          shareable = std::make_shared<reanimated::ShareableWorklet>(runtimeHelper, rt, object);
        } else if (!object.getProperty(rt, "__init").isUndefined()) {
          shareable = std::make_shared<reanimated::ShareableHandle>(runtimeHelper, rt, object);
        } else if (object.isFunction(rt)) {
          auto function = object.asFunction(rt);
          if (function.isHostFunction(rt)) {
            shareable =
                std::make_shared<reanimated::ShareableHostFunction>(rt, std::move(function));
          } else {
            shareable = std::make_shared<reanimated::ShareableRemoteFunction>(
                runtimeHelper, rt, std::move(function));
          }
        } else if (object.isArray(rt)) {
          if (shouldRetainRemote.isBool() && shouldRetainRemote.getBool()) {
            shareable = std::make_shared<reanimated::RetainingShareable<reanimated::ShareableArray>>(
                runtimeHelper, rt, object.asArray(rt));
          } else {
            shareable = std::make_shared<reanimated::ShareableArray>(rt, object.asArray(rt));
          }
        } else if (object.isHostObject(rt)) {
          shareable = std::make_shared<reanimated::ShareableHostObject>(
              runtimeHelper, rt, object.getHostObject(rt));
        } else {
          if (shouldRetainRemote.isBool() && shouldRetainRemote.getBool()) {
            shareable = std::make_shared<reanimated::RetainingShareable<reanimated::ShareableObject>>(
                runtimeHelper, rt, object);
          } else {
            shareable = std::make_shared<reanimated::ShareableObject>(rt, object);
          }
        }
      } else if (value.isString()) {
        shareable = std::make_shared<reanimated::ShareableString>(value.asString(rt).utf8(rt));
      } else if (value.isUndefined()) {
        shareable = std::make_shared<reanimated::ShareableScalar>();
      } else if (value.isNull()) {
        shareable = std::make_shared<reanimated::ShareableScalar>(nullptr);
      } else if (value.isBool()) {
        shareable = std::make_shared<reanimated::ShareableScalar>(value.getBool());
      } else if (value.isNumber()) {
        shareable = std::make_shared<reanimated::ShareableScalar>(value.getNumber());
      } else if (value.isSymbol()) {
        // TODO: this is only a placeholder implementation, here we replace symbols
        // with strings in order to make certain objects to be captured. There isn't
        // yet any usecase for using symbols on the UI runtime so it is fine to keep
        // it like this for now.
        shareable =
            std::make_shared<reanimated::ShareableString>(value.getSymbol(rt).toString(rt));
      } else {
        throw std::runtime_error("attempted to convert an unsupported value type");
      }
      return reanimated::ShareableJSRef::newHostObject(rt, shareable);
  };
    reanimated::jsi_utils::installJsiFunction(*runtimeManager->runtime, "_makeShareableClone", makeShareableClone);

  // setFrameProcessor(viewTag: number, frameProcessor: (frame: Frame) => void)
  auto setFrameProcessor = [self](jsi::Runtime& runtime,
                                  const jsi::Value& thisValue,
                                  const jsi::Value* arguments,
                                  size_t count) -> jsi::Value {
    NSLog(@"FrameProcessorBindings: Setting new frame processor...");
    if (!arguments[0].isNumber()) throw jsi::JSError(runtime, "Camera::setFrameProcessor: First argument ('viewTag') must be a number!");
    if (!arguments[1].isObject()) throw jsi::JSError(runtime, "Camera::setFrameProcessor: Second argument ('frameProcessor') must be a function!");
    if (!runtimeManager || !runtimeManager->runtime) throw jsi::JSError(runtime, "Camera::setFrameProcessor: The RuntimeManager is not yet initialized!");
      
//    const jsi::Value &callGuard = runtime.global().getProperty(runtime, "__callGuard");
//    assert(callGuard.isObject() && callGuard.asObject(runtime).isFunction(runtime));
//    const jsi::Value &valueUnpacker = runtime.global().getProperty(runtime, "__valueUnpacker");
//    assert(valueUnpacker.isObject() && valueUnpacker.asObject(runtime).isFunction(runtime));
//    runtimeHelper->callGuard = std::make_unique<reanimated::CoreFunction>(runtimeHelper.get(), callGuard);
//    runtimeHelper->valueUnpacker = std::make_unique<reanimated::CoreFunction>(runtimeHelper.get(), valueUnpacker);

    auto viewTag = arguments[0].asNumber();
    NSLog(@"FrameProcessorBindings: Adapting Shareable value from function (conversion to worklet)...");

//    assert(arguments[1].asObject(runtime).getProperty(runtime, "__workletHash").isUndefined() == false);
//    auto worklet = std::make_shared<reanimated::ShareableWorklet>(runtimeHelper, runtime, arguments[1].asObject(runtime));
    auto worklet = reanimated::extractShareableOrThrow<reanimated::ShareableWorklet>(runtime, arguments[1].asObject(runtime));
    NSLog(@"FrameProcessorBindings: Successfully created worklet!");

    RCTExecuteOnMainQueue([=]() {
      auto currentBridge = [RCTBridge currentBridge];
      auto anonymousView = [currentBridge.uiManager viewForReactTag:[NSNumber numberWithDouble:viewTag]];
      auto view = static_cast<CameraView*>(anonymousView);

      dispatch_async(CameraQueues.frameProcessorQueue, [=]() {
        NSLog(@"FrameProcessorBindings: Converting worklet to Objective-C callback...");
          
        assert(runtimeManager->runtime != nullptr);
        auto& rt = *runtimeManager->runtime;
        assert(worklet != nullptr);
        auto function = worklet->getJSValue(rt).asObject(rt).asFunction(rt);

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
