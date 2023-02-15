//
//  FrameHostObject.m
//  VisionCamera
//
//  Created by Marc Rousavy on 22.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#import "FrameHostObject.h"
#import <Foundation/Foundation.h>
#import <jsi/jsi.h>
#import "JsiHostObject.h"
#import "JsiSharedValue.h"

std::vector<jsi::PropNameID> FrameHostObject::getPropertyNames(jsi::Runtime& rt) {
  std::vector<jsi::PropNameID> result;
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("width")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("height")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("bytesPerRow")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("planesCount")));
  // Debugging
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("toString")));
  // Ref Management
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("isValid")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("incrementRefCount")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("decrementRefCount")));
  return result;
}

jsi::Value FrameHostObject::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);

  if (name == "toString") {
    auto toString = JSI_HOST_FUNCTION_LAMBDA {
      if (this->frame == nil) {
        return jsi::String::createFromUtf8(runtime, "[closed frame]");
      }
      auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
      auto width = CVPixelBufferGetWidth(imageBuffer);
      auto height = CVPixelBufferGetHeight(imageBuffer);

      NSMutableString* string = [NSMutableString stringWithFormat:@"%lu x %lu Frame", width, height];
      return jsi::String::createFromUtf8(runtime, string.UTF8String);
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "toString"), 0, toString);
  }
  if (name == "incrementRefCount") {
    auto incrementRefCount = JSI_HOST_FUNCTION_LAMBDA {
      // Increment retain count by one so ARC doesn't destroy the Frame Buffer.
      CFRetain(frame.buffer);
      return jsi::Value::undefined();
    };
    return jsi::Function::createFromHostFunction(runtime,
                                                 jsi::PropNameID::forUtf8(runtime, "incrementRefCount"),
                                                 0,
                                                 incrementRefCount);
  }
  
  if (name == "decrementRefCount") {
    auto decrementRefCount = JSI_HOST_FUNCTION_LAMBDA {
      // Decrement retain count by one. If the retain count is zero, ARC will destroy the Frame Buffer.
      CFRelease(frame.buffer);
      return jsi::Value::undefined();
    };
    return jsi::Function::createFromHostFunction(runtime,
                                                 jsi::PropNameID::forUtf8(runtime, "decrementRefCount"),
                                                 0,
                                                 decrementRefCount);
  }

  if (name == "isValid") {
    auto isValid = frame != nil && frame.buffer != nil && CFGetRetainCount(frame.buffer) > 0 && CMSampleBufferIsValid(frame.buffer);
    return jsi::Value(isValid);
  }
  if (name == "width") {
    auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    auto width = CVPixelBufferGetWidth(imageBuffer);
    return jsi::Value((double) width);
  }
  if (name == "height") {
    auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    auto height = CVPixelBufferGetHeight(imageBuffer);
    return jsi::Value((double) height);
  }
  if (name == "bytesPerRow") {
    auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    auto bytesPerRow = CVPixelBufferGetBytesPerRow(imageBuffer);
    return jsi::Value((double) bytesPerRow);
  }
  if (name == "planesCount") {
    auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    auto planesCount = CVPixelBufferGetPlaneCount(imageBuffer);
    return jsi::Value((double) planesCount);
  }

  // fallback to base implementation
  return HostObject::get(runtime, propName);
}
