//
//  FrameProcessorPluginHostObject.mm
//  VisionCamera
//
//  Created by Marc Rousavy on 21.07.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#import "FrameProcessorPluginHostObject.h"
#import "FrameHostObject.h"
#import "JSINSObjectConversion.h"
#import <Foundation/Foundation.h>
#import <vector>

using namespace facebook;

std::vector<jsi::PropNameID> FrameProcessorPluginHostObject::getPropertyNames(jsi::Runtime& runtime) {
  std::vector<jsi::PropNameID> result;
  result.push_back(jsi::PropNameID::forUtf8(runtime, std::string("call")));
  return result;
}

jsi::Value FrameProcessorPluginHostObject::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);

  if (name == "call") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forUtf8(runtime, "call"), 2,
        [=](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
          // Frame is first argument
          auto frameHostObject = arguments[0].asObject(runtime).asHostObject<FrameHostObject>(runtime);
          Frame* frame = frameHostObject->frame;

          // Options are second argument (possibly undefined)
          NSDictionary* options = nil;
          if (count > 1) {
            auto optionsObject = arguments[1].asObject(runtime);
            options = JSINSObjectConversion::convertJSIObjectToNSDictionary(runtime, optionsObject, _callInvoker);
          }

          // Call actual Frame Processor Plugin
          id result = [_plugin callback:frame withArguments:options];

          // Convert result value to jsi::Value (possibly undefined)
          return JSINSObjectConversion::convertObjCObjectToJSIValue(runtime, result);
        });
  }

  return jsi::Value::undefined();
}
