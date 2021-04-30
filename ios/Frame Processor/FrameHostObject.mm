//
//  FrameHostObject.m
//  VisionCamera
//
//  Created by Marc Rousavy on 22.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import "FrameHostObject.h"
#import <Foundation/Foundation.h>
#import <jsi/jsi.h>

jsi::Value FrameHostObject::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);
  
  // TODO: Implement custom getters so you can access the frame from JS
  
  if (name == "Symbol.toPrimitive") {
    // not implemented
    return jsi::Value::undefined();
  }
  if (name == "valueOf") {
    // not implemented
    return jsi::Value::undefined();
  }
  if (name == "toString") {
    auto toString = [this] (jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
      auto size = CMSampleBufferGetTotalSampleSize(buffer);
      
      NSMutableString* string = [NSMutableString stringWithFormat:@"Buffer (%lu bytes)", size];
      return jsi::String::createFromUtf8(runtime, string.UTF8String);
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "toString"), 0, toString);
  }
  
  if (name == "isValid") {
    auto isValid = buffer != nil && CMSampleBufferIsValid(buffer);
    return jsi::Value(isValid);
  }
  
  return jsi::Value::undefined();
}

FrameHostObject::~FrameHostObject() {
  destroyBuffer();
}

void FrameHostObject::destroyBuffer() {
  // ARC will hopefully delete it lol
  this->buffer = nil;
}
