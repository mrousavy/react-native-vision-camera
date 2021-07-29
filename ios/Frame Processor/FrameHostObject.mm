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

PixelBufferCache::~PixelBufferCache() {
  if (pixelBuffer != nil) {
    CFRelease(pixelBuffer);
  }
}

uint8_t* PixelBufferCache::getPixelBuffer() {
  if (pixelBuffer == nil) {
    auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    CVPixelBufferLockBaseAddress(imageBuffer, 0);
    void* buffer = CVPixelBufferGetBaseAddress(imageBuffer);
    CVPixelBufferUnlockBaseAddress(imageBuffer, 0);
    pixelBuffer = (uint8_t*)buffer;
  }
  return pixelBuffer;
}

size_t PixelBufferCache::getPixelBufferSize() {
  if (pixelBufferSize == -1) {
    auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    size_t bytesPerRow = CVPixelBufferGetBytesPerRow(imageBuffer);
    size_t height = CVPixelBufferGetHeight(imageBuffer);
    pixelBufferSize = bytesPerRow * height;
  }
  return pixelBufferSize;
}

std::vector<jsi::PropNameID> FrameHostObject::getPropertyNames(jsi::Runtime& rt) {
  std::vector<jsi::PropNameID> result;
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("toString")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("isValid")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("width")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("height")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("bytesPerRow")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("planesCount")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("close")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("pixels")));
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
    auto bytesPerRow = CVPixelBufferGetPlaneCount(imageBuffer);
    return jsi::Value((double) bytesPerRow);
  }
  if (name == "planesCount") {
    this->assertIsFrameStrong(runtime, name);
    auto imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    auto planesCount = CVPixelBufferGetPlaneCount(imageBuffer);
    return jsi::Value((double) planesCount);
  }
  if (name == "pixels") {
    auto pixelBuffer = pixelBufferCache.getPixelBuffer();
    auto pixelBufferSize = pixelBufferCache.getPixelBufferSize();
    
    auto start = pixelBuffer;
    auto end = start + (pixelBufferSize * sizeof(uint8_t));
    auto vector = std::vector<uint8_t>(start, end);

    return TypedArray<TypedArrayKind::Uint8Array>(runtime, vector);
  }

  return jsi::Value::undefined();
}

void FrameHostObject::assertIsFrameStrong(jsi::Runtime &runtime, const std::string &accessedPropName) {
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
