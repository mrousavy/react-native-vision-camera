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

#import "../../cpp/jsi/TypedArray.h"

namespace vision {

std::vector<jsi::PropNameID> FrameHostObject::getPropertyNames(jsi::Runtime& rt) {
  std::vector<jsi::PropNameID> result;
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("toString")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("isValid")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("width")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("height")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("bytesPerRow")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("planesCount")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("close")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("planes")));
  return result;
}

jsi::Value FrameHostObject::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);

  if (name == "toString") {
    auto toString = [this] (jsi::Runtime& runtime, const jsi::Value&, const jsi::Value*, size_t) -> jsi::Value {
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
    auto close = [this] (jsi::Runtime& runtime, const jsi::Value&, const jsi::Value*, size_t) -> jsi::Value {
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
  if (name == "planes") {
    this->assertIsFrameStrong(runtime, name);
    auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    bool isPlanar = CVPixelBufferIsPlanar(imageBuffer);
    
    if (isPlanar) {
      // Image Buffer is separated into planes
      auto planesCount = CVPixelBufferGetPlaneCount(imageBuffer);
      auto planes = jsi::Array(runtime, (size_t) planesCount);
      
      for (size_t i = 0; i < planesCount; i++) {
        int result = CVPixelBufferLockBaseAddress(imageBuffer, kCVPixelBufferLock_ReadOnly);
        if (result != noErr) {
          throw jsi::JSError(runtime, "Failed to read the Frame's pixel buffer! Error code: " + std::to_string(result));
        }
        uint8_t* buffer = (uint8_t*) CVPixelBufferGetBaseAddressOfPlane(imageBuffer, i);
        CVPixelBufferUnlockBaseAddress(imageBuffer, kCVPixelBufferLock_ReadOnly);
        
        auto bytesPerRow = CVPixelBufferGetBytesPerRowOfPlane(imageBuffer, i);
        auto height = CVPixelBufferGetHeightOfPlane(imageBuffer, i);
        auto size = bytesPerRow * height;
        
        auto start = buffer;
        auto end = start + (size * sizeof(buffer[0]));
        auto vector = std::vector<uint8_t>(start, end);
        
        auto& arrayCache = this->cacheProvider->getArrayBufferCache(i, vector.size());
        arrayCache.update(runtime, vector);
        
        auto plane = jsi::Object(runtime);
        plane.setProperty(runtime, "pixels", arrayCache);
        
        planes.setValueAtIndex(runtime, i, plane);
      }
      
      return planes;
    } else {
      // Image Buffer is not separated into planes, buffer accessible at once
      auto planes = jsi::Array(runtime, 1);
      
      int result = CVPixelBufferLockBaseAddress(imageBuffer, kCVPixelBufferLock_ReadOnly);
      if (result != noErr) {
        throw jsi::JSError(runtime, "Failed to read the Frame's pixel buffer! Error code: " + std::to_string(result));
      }
      uint8_t* buffer = (uint8_t*) CVPixelBufferGetBaseAddress(imageBuffer);
      CVPixelBufferUnlockBaseAddress(imageBuffer, kCVPixelBufferLock_ReadOnly);
      
      auto bytesPerRow = CVPixelBufferGetBytesPerRow(imageBuffer);
      auto height = CVPixelBufferGetHeight(imageBuffer);
      auto size = bytesPerRow * height;
      
      auto start = buffer;
      auto end = start + (size * sizeof(uint8_t));
      auto vector = std::vector<uint8_t>(start, end);
      
      auto& arrayCache = this->cacheProvider->getArrayBufferCache(0, vector.size());
      arrayCache.update(runtime, vector);

      auto plane = jsi::Object(runtime);
      plane.setProperty(runtime, "pixels", arrayCache);
      
      planes.setValueAtIndex(runtime, 0, plane);
      return planes;
    }
  }

  return jsi::Value::undefined();
}

void FrameHostObject::assertIsFrameStrong(jsi::Runtime& runtime, const std::string& accessedPropName) {
  if (frame == nil) {
    auto message = "Cannot get `" + accessedPropName + "`, frame is already closed!";
    throw jsi::JSError(runtime, message.c_str());
  }
}

FrameHostObject::~FrameHostObject() {
  close();
}

void FrameHostObject::close() {
  if (frame != nil) {
    CMSampleBufferInvalidate(frame.buffer);
    // ARC will hopefully delete it lol
    this->frame = nil;
  }
}

} // namespace vision
