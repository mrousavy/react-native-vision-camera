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

std::vector<jsi::PropNameID> FrameHostObject::getPropertyNames(jsi::Runtime& rt) {
  std::vector<jsi::PropNameID> result;
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("toString")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("isValid")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("isReady")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("width")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("height")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("bytesPerRow")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("planesCount")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("buffer")));
  return result;
}

jsi::Value FrameHostObject::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);
  
  
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
      auto imageBuffer = CMSampleBufferGetImageBuffer(buffer);
      auto width = CVPixelBufferGetWidth(imageBuffer);
      auto height = CVPixelBufferGetHeight(imageBuffer);
      
      NSMutableString* string = [NSMutableString stringWithFormat:@"%lu x %lu Frame", width, height];
      return jsi::String::createFromUtf8(runtime, string.UTF8String);
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "toString"), 0, toString);
  }
  
  if (name == "isValid") {
    auto isValid = buffer != nil && CMSampleBufferIsValid(buffer);
    return jsi::Value(isValid);
  }
  if (name == "isReady") {
    auto isReady = buffer != nil && CMSampleBufferDataIsReady(buffer);
    return jsi::Value(isReady);
  }
  if (name == "width") {
    auto imageBuffer = CMSampleBufferGetImageBuffer(buffer);
    auto width = CVPixelBufferGetWidth(imageBuffer);
    return jsi::Value((double) width);
  }
  if (name == "height") {
    auto imageBuffer = CMSampleBufferGetImageBuffer(buffer);
    auto height = CVPixelBufferGetHeight(imageBuffer);
    return jsi::Value((double) height);
  }
  if (name == "bytesPerRow") {
    auto imageBuffer = CMSampleBufferGetImageBuffer(buffer);
    auto bytesPerRow = CVPixelBufferGetPlaneCount(imageBuffer);
    return jsi::Value((double) bytesPerRow);
  }
  if (name == "planesCount") {
    auto imageBuffer = CMSampleBufferGetImageBuffer(buffer);
    auto planesCount = CVPixelBufferGetPlaneCount(imageBuffer);
    return jsi::Value((double) planesCount);
  }
  if (name == "buffer") {
    // TODO: Actually return the pixels of the buffer. Not sure if this will be a huge performance hit or not
    return jsi::Array(runtime, 0);
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
