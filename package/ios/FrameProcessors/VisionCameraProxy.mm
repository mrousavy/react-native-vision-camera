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

#import "FrameProcessor.h"
#import "FrameProcessorPluginHostObject.h"
#import "FrameProcessorPluginRegistry.h"
#import "JSINSObjectConversion.h"
#import "VisionCameraProxyHolder.h"
#import "WKTJsiWorklet.h"

using namespace facebook;

VisionCameraProxy::VisionCameraProxy(jsi::Runtime& runtime, std::shared_ptr<react::CallInvoker> callInvoker,
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
    dispatch_async(delegate.getDispatchQueue, [f = std::move(f)]() { f(); });
  };

  _workletContext = std::make_shared<RNWorklet::JsiWorkletContext>("VisionCamera");
  _workletContext->initialize("VisionCamera", &runtime, runOnJS, runOnWorklet);
  NSLog(@"VisionCameraProxy: Worklet Context Created!");
}

VisionCameraProxy::~VisionCameraProxy() {
  NSLog(@"VisionCameraProxy: Destroying VisionCameraProxy...");
}

std::vector<jsi::PropNameID> VisionCameraProxy::getPropertyNames(jsi::Runtime& runtime) {
  return jsi::PropNameID::names(runtime, "setFrameProcessor", "removeFrameProcessor", "initFrameProcessorPlugin", "workletContext");
}

void VisionCameraProxy::setFrameProcessor(jsi::Runtime& runtime, double jsViewTag, jsi::Function&& function) {
  auto sharedFunction = std::make_shared<jsi::Function>(std::move(function));
  auto worklet = std::make_shared<RNWorklet::JsiWorklet>(runtime, sharedFunction);

  // Call Swift delegate to set the Frame Processor (maybe on UI Thread)
  FrameProcessor* frameProcessor = [[FrameProcessor alloc] initWithWorklet:worklet context:_workletContext];
  NSNumber* viewTag = [NSNumber numberWithDouble:jsViewTag];
  [_delegate setFrameProcessor:frameProcessor forView:viewTag];
}

void VisionCameraProxy::removeFrameProcessor(jsi::Runtime& runtime, double jsViewTag) {
  NSNumber* viewTag = [NSNumber numberWithDouble:jsViewTag];
  [_delegate removeFrameProcessorForView:viewTag];
}

jsi::Value VisionCameraProxy::initFrameProcessorPlugin(jsi::Runtime& runtime, const jsi::String& name, const jsi::Object& options) {
  std::string nameString = name.utf8(runtime);
  NSString* key = [NSString stringWithUTF8String:nameString.c_str()];
  NSDictionary* optionsObjc = JSINSObjectConversion::convertJSIObjectToObjCDictionary(runtime, options);
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
          if (count != 2) {
            throw jsi::JSError(runtime, "setFrameProcessor expected 2 arguments, but received " + std::to_string(count));
          }
          auto jsViewTag = arguments[0].asNumber();
          auto jsWorklet = arguments[1].asObject(runtime).asFunction(runtime);
          setFrameProcessor(runtime, jsViewTag, std::move(jsWorklet));

          return jsi::Value::undefined();
        });
  } else if (name == "removeFrameProcessor") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forUtf8(runtime, "removeFrameProcessor"), 1,
        [this](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
          auto jsViewTag = arguments[0].asNumber();
          removeFrameProcessor(runtime, jsViewTag);

          return jsi::Value::undefined();
        });
  } else if (name == "initFrameProcessorPlugin") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forUtf8(runtime, "initFrameProcessorPlugin"), 1,
        [this](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
          if (count < 1 || !arguments[0].isString()) {
            throw jsi::JSError(runtime, "First argument needs to be a string (pluginName)!");
          }
          auto pluginName = arguments[0].asString(runtime);
          auto options = count > 1 ? arguments[1].asObject(runtime) : jsi::Object(runtime);

          return this->initFrameProcessorPlugin(runtime, pluginName, options);
        });
  } else if (name == "workletContext") {
    return jsi::Object::createFromHostObject(runtime, _workletContext);
  }

  return jsi::Value::undefined();
}
