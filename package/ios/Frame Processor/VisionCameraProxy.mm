//
//  VisionCameraProxy.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 20.07.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#import "VisionCameraProxy.h"
#import <Foundation/Foundation.h>
#import <jsi/jsi.h>

#import "FrameHostObject.h"
#import "FrameProcessor.h"
#import "FrameProcessorPluginHostObject.h"
#import "FrameProcessorPluginRegistry.h"
#import "JSINSObjectConversion.h"
#import "WKTJsiWorklet.h"

#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import <React/RCTUtils.h>
#import <ReactCommon/RCTTurboModuleManager.h>

// Swift forward-declarations
__attribute__((objc_runtime_name("_TtC12VisionCamera12CameraQueues")))
@interface CameraQueues : NSObject
@property(nonatomic, class, readonly, strong) dispatch_queue_t _Nonnull videoQueue;
@end

__attribute__((objc_runtime_name("_TtC12VisionCamera10CameraView")))
@interface CameraView : UIView
@property(nonatomic, copy) FrameProcessor* _Nullable frameProcessor;
@end

using namespace facebook;

VisionCameraProxy::VisionCameraProxy(jsi::Runtime& runtime, std::shared_ptr<react::CallInvoker> callInvoker) {
  _callInvoker = callInvoker;

  NSLog(@"VisionCameraProxy: Creating Worklet Context...");
  auto runOnJS = [callInvoker](std::function<void()>&& f) {
    // Run on React JS Runtime
    callInvoker->invokeAsync(std::move(f));
  };
  auto runOnWorklet = [](std::function<void()>&& f) {
    // Run on Frame Processor Worklet Runtime
    dispatch_async(CameraQueues.videoQueue, [f = std::move(f)]() { f(); });
  };

  _workletContext = std::make_shared<RNWorklet::JsiWorkletContext>("VisionCamera", &runtime, runOnJS, runOnWorklet);
  NSLog(@"VisionCameraProxy: Worklet Context Created!");
}

VisionCameraProxy::~VisionCameraProxy() {
  NSLog(@"VisionCameraProxy: Destroying VisionCameraProxy...");
}

std::vector<jsi::PropNameID> VisionCameraProxy::getPropertyNames(jsi::Runtime& runtime) {
  std::vector<jsi::PropNameID> result;
  result.push_back(jsi::PropNameID::forUtf8(runtime, std::string("setFrameProcessor")));
  result.push_back(jsi::PropNameID::forUtf8(runtime, std::string("removeFrameProcessor")));
  result.push_back(jsi::PropNameID::forUtf8(runtime, std::string("initFrameProcessorPlugin")));
  return result;
}

void VisionCameraProxy::setFrameProcessor(jsi::Runtime& runtime, int viewTag, const jsi::Object& object) {
  auto frameProcessorType = object.getProperty(runtime, "type").asString(runtime).utf8(runtime);
  auto worklet = std::make_shared<RNWorklet::JsiWorklet>(runtime, object.getProperty(runtime, "frameProcessor"));

  RCTExecuteOnMainQueue(^{
    auto currentBridge = [RCTBridge currentBridge];
    auto anonymousView = [currentBridge.uiManager viewForReactTag:[NSNumber numberWithDouble:viewTag]];
    auto view = static_cast<CameraView*>(anonymousView);
    if (frameProcessorType == "frame-processor") {
      view.frameProcessor = [[FrameProcessor alloc] initWithWorklet:worklet context:_workletContext];
    } else {
      throw std::runtime_error("Unknown FrameProcessor.type passed! Received: " + frameProcessorType);
    }
  });
}

void VisionCameraProxy::removeFrameProcessor(jsi::Runtime& runtime, int viewTag) {
  RCTExecuteOnMainQueue(^{
    auto currentBridge = [RCTBridge currentBridge];
    auto anonymousView = [currentBridge.uiManager viewForReactTag:[NSNumber numberWithDouble:viewTag]];
    auto view = static_cast<CameraView*>(anonymousView);
    view.frameProcessor = nil;
  });
}

jsi::Value VisionCameraProxy::initFrameProcessorPlugin(jsi::Runtime& runtime, std::string name, const jsi::Object& options) {
  NSString* key = [NSString stringWithUTF8String:name.c_str()];
  NSDictionary* optionsObjc = JSINSObjectConversion::convertJSIObjectToNSDictionary(runtime, options, _callInvoker);
  VisionCameraProxyHolder* proxy = [[VisionCameraProxyHolder alloc] initWithProxy:this];
  FrameProcessorPlugin* plugin = [FrameProcessorPluginRegistry getPlugin:key withProxy:proxy withOptions:optionsObjc];
  if (plugin == nil) {
    return jsi::Value::undefined();
  }

  auto pluginHostObject = std::make_shared<FrameProcessorPluginHostObject>(plugin, _callInvoker);
  return jsi::Object::createFromHostObject(runtime, pluginHostObject);
}

jsi::Value VisionCameraProxy::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);

  if (name == "setFrameProcessor") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forUtf8(runtime, "setFrameProcessor"), 1,
        [this](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
          auto viewTag = arguments[0].asNumber();
          auto object = arguments[1].asObject(runtime);
          this->setFrameProcessor(runtime, static_cast<int>(viewTag), object);
          return jsi::Value::undefined();
        });
  }
  if (name == "removeFrameProcessor") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forUtf8(runtime, "removeFrameProcessor"), 1,
        [this](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
          auto viewTag = arguments[0].asNumber();
          this->removeFrameProcessor(runtime, static_cast<int>(viewTag));
          return jsi::Value::undefined();
        });
  }
  if (name == "initFrameProcessorPlugin") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forUtf8(runtime, "initFrameProcessorPlugin"), 1,
        [this](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
          if (count < 1 || !arguments[0].isString()) {
            throw jsi::JSError(runtime, "First argument needs to be a string (pluginName)!");
          }
          auto pluginName = arguments[0].asString(runtime).utf8(runtime);
          auto options = count > 1 ? arguments[1].asObject(runtime) : jsi::Object(runtime);

          return this->initFrameProcessorPlugin(runtime, pluginName, options);
        });
  }

  return jsi::Value::undefined();
}

@implementation VisionCameraProxyHolder {
  VisionCameraProxy* _proxy;
}

- (instancetype)initWithProxy:(void*)proxy {
  if (self = [super init]) {
    _proxy = (VisionCameraProxy*)proxy;
  }
  return self;
}

- (VisionCameraProxy*)proxy {
  return _proxy;
}

@end

@implementation VisionCameraInstaller

+ (BOOL)installToBridge:(RCTBridge* _Nonnull)bridge {
  RCTCxxBridge* cxxBridge = (RCTCxxBridge*)[RCTBridge currentBridge];
  if (!cxxBridge.runtime) {
    return NO;
  }

  jsi::Runtime& runtime = *(jsi::Runtime*)cxxBridge.runtime;

  // global.VisionCameraProxy
  auto visionCameraProxy = std::make_shared<VisionCameraProxy>(runtime, bridge.jsCallInvoker);
  runtime.global().setProperty(runtime, "VisionCameraProxy", jsi::Object::createFromHostObject(runtime, visionCameraProxy));

  return YES;
}

@end
