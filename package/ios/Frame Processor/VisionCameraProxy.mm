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

#import "VisionCameraProxyHolder.h"
#import "FrameProcessor.h"
#import "FrameProcessorPluginHostObject.h"
#import "FrameProcessorPluginRegistry.h"
#import "JSINSObjectConversion.h"
#import "WKTJsiWorklet.h"

using namespace facebook;

VisionCameraProxy::VisionCameraProxy(jsi::Runtime& runtime,
                                     std::shared_ptr<react::CallInvoker> callInvoker,
                                     id<VisionCameraProxyDelegate> delegate) {
  _callInvoker = callInvoker;
  _delegate = delegate;

  NSLog(@"VisionCameraProxy: Creating Worklet Context...");
  auto runOnJS = [callInvoker](std::function<void()>&& f) {
    // Run on React JS Runtime
    callInvoker->invokeAsync(std::move(f));
  };
  auto runOnWorklet = [delegate](std::function<void()>&& f) {
    // Run on Frame Processor Worklet Runtime
    dispatch_async(delegate.dispatchQueue, [f = std::move(f)]() { f(); });
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
  result.push_back(jsi::PropNameID::forUtf8(runtime, std::string("workletContext")));
  return result;
}

void VisionCameraProxy::setFrameProcessor(jsi::Runtime& runtime, int viewTag, const std::shared_ptr<jsi::Function>& function) {

  RCTExecuteOnMainQueue(^{
    auto currentBridge = [RCTBridge currentBridge];
    auto anonymousView = [currentBridge.uiManager viewForReactTag:[NSNumber numberWithDouble:viewTag]];
    auto view = static_cast<CameraView*>(anonymousView);
    view.frameProcessor = frameProcessor;
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

  @try {
    FrameProcessorPlugin* plugin = [FrameProcessorPluginRegistry getPlugin:key withProxy:proxy withOptions:optionsObjc];
    if (plugin == nil) {
      return jsi::Value::undefined();
    }

    auto pluginHostObject = std::make_shared<FrameProcessorPluginHostObject>(plugin, _callInvoker);
    return jsi::Object::createFromHostObject(runtime, pluginHostObject);
  } @catch (NSException* exception) {
    // Objective-C plugin threw an error when initializing.
    NSString* message = [NSString stringWithFormat:@"%@: %@", exception.name, exception.reason];
    throw jsi::JSError(runtime, message.UTF8String);
  }
}

jsi::Value VisionCameraProxy::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);

  if (name == "setFrameProcessor") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forUtf8(runtime, "setFrameProcessor"), 1,
        [this](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
          auto jsViewTag = arguments[0].asNumber();
          auto jsWorklet = arguments[1].asObject(runtime).asFunction(runtime);
          auto worklet = std::make_shared<RNWorklet::JsiWorklet>(runtime, jsWorklet);

          // Call Swift delegate to set the Frame Processor (maybe on UI Thread)
          FrameProcessor* frameProcessor = [[FrameProcessor alloc] initWithWorklet:worklet context:_workletContext];
          NSNumber* viewTag = [NSNumber numberWithDouble:jsViewTag];
          [_delegate setFrameProcessor:frameProcessor forView:viewTag];

          return jsi::Value::undefined();
        });
  } else if (name == "removeFrameProcessor") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forUtf8(runtime, "removeFrameProcessor"), 1,
        [this](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
          auto jsViewTag = arguments[0].asNumber();

          // Call Swift delegate to remove Frame Processor (maybe on UI Thread)
          NSNumber* viewTag = [NSNumber numberWithDouble:jsViewTag];
          [_delegate removeFrameProcessorForView:viewTag];

          return jsi::Value::undefined();
        });
  } else if (name == "initFrameProcessorPlugin") {
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
  } else if (name == "workletContext") {
    return jsi::Object::createFromHostObject(runtime, _workletContext);
  }

  return jsi::Value::undefined();
}
