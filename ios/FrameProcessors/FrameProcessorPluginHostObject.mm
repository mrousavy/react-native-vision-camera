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
  return jsi::PropNameID::names(runtime, "call");
}

jsi::Value FrameProcessorPluginHostObject::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);

  if (name == "call") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forUtf8(runtime, "call"), 2,
        [=](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
          // Frame is first argument
          auto frameHolder = arguments[0].asObject(runtime);
          std::shared_ptr<FrameHostObject> frameHostObject;
          if (frameHolder.isHostObject<FrameHostObject>(runtime)) {
            // User directly passed FrameHostObject
            frameHostObject = frameHolder.getHostObject<FrameHostObject>(runtime);
          } else {
            // User passed a wrapper, e.g. DrawableFrame which contains the FrameHostObject as a hidden property
            jsi::Object actualFrame = frameHolder.getPropertyAsObject(runtime, "__frame");
            frameHostObject = actualFrame.asHostObject<FrameHostObject>(runtime);
          }
          Frame* frame = frameHostObject->getFrame();

          // Options are second argument (possibly undefined)
          NSDictionary* options = nil;
          if (count > 1) {
            auto optionsObject = arguments[1].asObject(runtime);
            options = JSINSObjectConversion::convertJSIObjectToObjCDictionary(runtime, optionsObject);
          }

          @try {
            // Call actual Frame Processor Plugin
            id result = [_plugin callback:frame withArguments:options];

            // Convert result value to jsi::Value (possibly undefined)
            return JSINSObjectConversion::convertObjCObjectToJSIValue(runtime, result);
          } @catch (NSException* exception) {
            // Objective-C plugin threw an error.
            NSString* message = [NSString stringWithFormat:@"%@: %@", exception.name, exception.reason];
            throw jsi::JSError(runtime, message.UTF8String);
          }
        });
  }

  return jsi::Value::undefined();
}
