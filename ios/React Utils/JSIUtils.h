//
//  JSIUtils.h
//  VisionCamera
//
//  Created by Marc Rousavy on 30.04.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#pragma once

#import <jsi/jsi.h>
#import <ReactCommon/CallInvoker.h>
#import <React/RCTBridgeModule.h>

using namespace facebook;
using namespace facebook::react;

jsi::Value convertNSNumberToJSIBoolean(jsi::Runtime& runtime, NSNumber* value);

jsi::Value convertNSNumberToJSINumber(jsi::Runtime& runtime, NSNumber* value);
jsi::String convertNSStringToJSIString(jsi::Runtime& runtime, NSString* value);

jsi::Object convertNSDictionaryToJSIObject(jsi::Runtime& runtime, NSDictionary* value);

jsi::Array convertNSArrayToJSIArray(jsi::Runtime& runtime, NSArray* value);

jsi::Value convertObjCObjectToJSIValue(jsi::Runtime& runtime, id value);

NSString* convertJSIStringToNSString(jsi::Runtime& runtime, const jsi::String& value);

NSArray* convertJSICStyleArrayToNSArray(jsi::Runtime& runtime, const jsi::Value* array, size_t length, std::shared_ptr<CallInvoker> jsInvoker);

jsi::Value* convertNSArrayToJSICStyleArray(jsi::Runtime& runtime, NSArray* array);

NSArray* convertJSIArrayToNSArray(jsi::Runtime& runtime, const jsi::Array& value, std::shared_ptr<CallInvoker> jsInvoker);

NSDictionary* convertJSIObjectToNSDictionary(jsi::Runtime& runtime, const jsi::Object& value, std::shared_ptr<CallInvoker> jsInvoker);

id convertJSIValueToObjCObject(jsi::Runtime& runtime, const jsi::Value& value, std::shared_ptr<CallInvoker> jsInvoker);

RCTResponseSenderBlock convertJSIFunctionToCallback(jsi::Runtime& runtime, const jsi::Function& value, std::shared_ptr<CallInvoker> jsInvoker);
