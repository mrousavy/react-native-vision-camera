//
//  JSINSObjectConversion.mm
//  VisionCamera
//
//  Forked and Adjusted by Marc Rousavy on 02.05.21.
//  Copyright © 2021 mrousavy & Facebook. All rights reserved.
//
//  Forked and adjusted from:
//  https://github.com/facebook/react-native/blob/900210cacc4abca0079e3903781bc223c80c8ac7/ReactCommon/react/nativemodule/core/platform/ios/RCTTurboModule.mm
//  Original Copyright Notice:
//
//  Copyright (c) Facebook, Inc. and its affiliates.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "JSINSObjectConversion.h"
#import "Frame.h"
#import "FrameHostObject.h"
#import "SharedArray.h"
#import <Foundation/Foundation.h>
#import <ReactCommon/CallInvoker.h>
#import <jsi/jsi.h>

using namespace facebook;
using namespace facebook::react;

namespace JSINSObjectConversion {

jsi::Value convertObjCObjectToJSIValue(jsi::Runtime& runtime, id value) {
  if (value == nil || value == (id)kCFNull) {
    // null

    return jsi::Value::undefined();
  } else if ([value isKindOfClass:[NSNumber class]]) {
    NSNumber* number = (NSNumber*)value;
    if ([value isKindOfClass:[@YES class]]) {
      // Boolean

      return jsi::Value(static_cast<bool>(number.boolValue));
    }

    // Double

    return jsi::Value(number.doubleValue);
  } else if ([value isKindOfClass:[NSString class]]) {
    // String

    NSString* string = (NSString*)value;
    return jsi::String::createFromUtf8(runtime, string.UTF8String);
  } else if ([value isKindOfClass:[NSDictionary class]]) {
    // Object

    NSDictionary* dictionary = (NSDictionary*)value;
    jsi::Object result(runtime);
    for (NSString* key in dictionary) {
      result.setProperty(runtime, key.UTF8String, convertObjCObjectToJSIValue(runtime, dictionary[key]));
    }
    return result;
  } else if ([value isKindOfClass:[NSArray class]]) {
    // Array

    NSArray* array = (NSArray*)value;
    jsi::Array result(runtime, array.count);
    for (size_t i = 0; i < array.count; i++) {
      result.setValueAtIndex(runtime, i, convertObjCObjectToJSIValue(runtime, value[i]));
    }
    return result;
  } else if ([value isKindOfClass:[Frame class]]) {
    // Frame

    Frame* frame = (Frame*)value;
    auto frameHostObject = std::make_shared<FrameHostObject>(frame);
    return jsi::Object::createFromHostObject(runtime, frameHostObject);
  } else if ([value isKindOfClass:[SharedArray class]]) {
    // SharedArray

    SharedArray* sharedArray = (SharedArray*)value;
    return sharedArray.arrayBuffer->getArrayBuffer(runtime);
  }

  NSString* className = NSStringFromClass([value class]);
  std::string classNameString = std::string(className.UTF8String);
  throw std::runtime_error("Cannot convert Objective-C type \"" + classNameString + "\" to jsi::Value!");
}

NSDictionary* convertJSIObjectToObjCDictionary(jsi::Runtime& runtime, const jsi::Object& object) {
  jsi::Array propertyNames = object.getPropertyNames(runtime);
  size_t size = propertyNames.size(runtime);
  NSMutableDictionary* result = [NSMutableDictionary new];
  for (size_t i = 0; i < size; i++) {
    jsi::String name = propertyNames.getValueAtIndex(runtime, i).getString(runtime);
    jsi::Value value = object.getProperty(runtime, name);
    NSString* key = [NSString stringWithUTF8String:name.utf8(runtime).c_str()];
    result[key] = convertJSIValueToObjCObject(runtime, value);
  }
  return [result copy];
}

id convertJSIValueToObjCObject(jsi::Runtime& runtime, const jsi::Value& value) {
  if (value.isUndefined() || value.isNull()) {
    // undefined/null
    return nil;
  } else if (value.isBool()) {
    // bool
    return [NSNumber numberWithBool:value.getBool()];
  } else if (value.isNumber()) {
    // number
    return [NSNumber numberWithDouble:value.getNumber()];
  } else if (value.isString()) {
    // string
    std::string string = value.getString(runtime).utf8(runtime);
    return [NSString stringWithUTF8String:string.c_str()];
  } else if (value.isObject()) {
    // object
    jsi::Object object = value.getObject(runtime);
    if (object.isArray(runtime)) {
      // array[]
      jsi::Array array = object.getArray(runtime);
      size_t size = array.size(runtime);
      NSMutableArray* result = [NSMutableArray new];
      for (size_t i = 0; i < size; i++) {
        jsi::Value value = array.getValueAtIndex(runtime, i);
        [result addObject:convertJSIValueToObjCObject(runtime, value)];
      }
      return [result copy];
    } else if (object.isHostObject(runtime)) {
      if (object.isHostObject<FrameHostObject>(runtime)) {
        // Frame
        auto hostObject = object.getHostObject<FrameHostObject>(runtime);
        return hostObject->getFrame();
      } else {
        throw std::runtime_error("The given HostObject is not supported by a Frame Processor Plugin!");
      }
    } else if (object.isArrayBuffer(runtime)) {
      // ArrayBuffer
      auto arrayBuffer = std::make_shared<jsi::ArrayBuffer>(object.getArrayBuffer(runtime));
      return [[SharedArray alloc] initWithRuntime:runtime wrapArrayBuffer:arrayBuffer];
    } else {
      // object
      return convertJSIObjectToObjCDictionary(runtime, object);
    }
  }

  auto stringRepresentation = value.toString(runtime).utf8(runtime);
  throw std::runtime_error("Failed to convert jsi::Value to JNI value - unsupported type! " + stringRepresentation);
}

} // namespace JSINSObjectConversion
