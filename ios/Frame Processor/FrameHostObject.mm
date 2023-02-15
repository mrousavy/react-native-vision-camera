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
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("toString")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("isValid")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("width")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("height")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("bytesPerRow")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("planesCount")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("refCount")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("close")));
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
  if (name == "close") {
    auto close = JSI_HOST_FUNCTION_LAMBDA {
      if (this->frame == nil) {
        throw jsi::JSError(runtime, "Trying to close an already closed frame! Did you call frame.close() twice?");
      }
      this->close();
      return jsi::Value::undefined();
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "close"), 0, close);
  }

  if (name == "isValid") {
    auto isValid = frame != nil && CMSampleBufferIsValid(frame.buffer);
    return jsi::Value(isValid);
  }
  if (name == "width") {
    this->assertIsFrameStrong(runtime, name);
    auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    auto width = CVPixelBufferGetWidth(imageBuffer);
    return jsi::Value((double) width);
  }
  if (name == "height") {
    this->assertIsFrameStrong(runtime, name);
    auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    auto height = CVPixelBufferGetHeight(imageBuffer);
    return jsi::Value((double) height);
  }
  if (name == "bytesPerRow") {
    this->assertIsFrameStrong(runtime, name);
    auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    auto bytesPerRow = CVPixelBufferGetBytesPerRow(imageBuffer);
    return jsi::Value((double) bytesPerRow);
  }
  if (name == "planesCount") {
    this->assertIsFrameStrong(runtime, name);
    auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    auto planesCount = CVPixelBufferGetPlaneCount(imageBuffer);
    return jsi::Value((double) planesCount);
  }
  if (name == "refCount") {
    if (!_refCount) {
      _refCount = std::make_shared<RNWorklet::JsiSharedValue>(jsi::Value(0),
                                                              RNWorklet::JsiWorkletContext::getDefaultInstance());
    }
    return jsi::Object::createFromHostObject(runtime, _refCount);
  }

  // fallback to base implementation
  return HostObject::get(runtime, propName);
}

void FrameHostObject::set(jsi::Runtime& runtime, const jsi::PropNameID& propName, const jsi::Value& value) {
  auto name = propName.utf8(runtime);

  if (name == "refCount") {
    _refCount = value.asObject(runtime).asHostObject<RNWorklet::JsiSharedValue>(runtime);
    return;
  }

  // fallback to base implementation
  HostObject::set(runtime, propName, value);
}

void FrameHostObject::assertIsFrameStrong(jsi::Runtime &runtime, const std::string &accessedPropName) {
  if (frame == nil) {
    auto message = "Cannot get `" + accessedPropName + "`, frame is already closed!";
    throw jsi::JSError(runtime, message.c_str());
  }
}

void FrameHostObject::close() {
  if (frame != nil) {
    CMSampleBufferInvalidate(frame.buffer);
    // ARC will hopefully delete it lol
    this->frame = nil;
  }
}
