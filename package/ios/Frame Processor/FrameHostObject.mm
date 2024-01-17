//
//  FrameHostObject.m
//  VisionCamera
//
//  Created by Marc Rousavy on 22.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#import "FrameHostObject.h"
#import "MutableRawBuffer.h"
#import "UIImageOrientation+descriptor.h"
#import "WKTJsiHostObject.h"
#import <Foundation/Foundation.h>
#import <jsi/jsi.h>

std::vector<jsi::PropNameID> FrameHostObject::getPropertyNames(jsi::Runtime& rt) {
  std::vector<jsi::PropNameID> result;
  // Ref Management
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("isValid")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("incrementRefCount")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("decrementRefCount")));

  if (frame != nil && frame.isValid) {
    // Frame Properties
    result.push_back(jsi::PropNameID::forUtf8(rt, std::string("width")));
    result.push_back(jsi::PropNameID::forUtf8(rt, std::string("height")));
    result.push_back(jsi::PropNameID::forUtf8(rt, std::string("bytesPerRow")));
    result.push_back(jsi::PropNameID::forUtf8(rt, std::string("planesCount")));
    result.push_back(jsi::PropNameID::forUtf8(rt, std::string("orientation")));
    result.push_back(jsi::PropNameID::forUtf8(rt, std::string("isMirrored")));
    result.push_back(jsi::PropNameID::forUtf8(rt, std::string("timestamp")));
    result.push_back(jsi::PropNameID::forUtf8(rt, std::string("pixelFormat")));
    // Conversion
    result.push_back(jsi::PropNameID::forUtf8(rt, std::string("toString")));
    result.push_back(jsi::PropNameID::forUtf8(rt, std::string("toArrayBuffer")));
  }

  return result;
}

Frame* FrameHostObject::getFrame() {
  Frame* frame = this->frame;
  if (frame == nil || !frame.isValid) {
    throw std::runtime_error("Frame is already closed! "
                             "Are you trying to access the Image data outside of a Frame Processor's lifetime?\n"
                             "- If you want to use `console.log(frame)`, use `console.log(frame.toString())` instead.\n"
                             "- If you want to do async processing, use `runAsync(...)` instead.\n"
                             "- If you want to use runOnJS, increment it's ref-count: `frame.incrementRefCount()`");
  }
  return frame;
}

#define JSI_FUNC [=](jsi::Runtime & runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value

jsi::Value FrameHostObject::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);

  if (name == "toString") {
    auto toString = JSI_FUNC {
      // Lock Frame so it cannot be deallocated while we access it
      std::lock_guard lock(this->_mutex);

      // Print debug description (width, height)
      Frame* frame = this->getFrame();
      NSMutableString* string = [NSMutableString stringWithFormat:@"%lu x %lu %@ Frame", frame.width, frame.height, frame.pixelFormat];
      return jsi::String::createFromUtf8(runtime, string.UTF8String);
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "toString"), 0, toString);
  }
  if (name == "incrementRefCount") {
    auto incrementRefCount = JSI_FUNC {
      // Lock Frame so it cannot be deallocated while we access it
      std::lock_guard lock(this->_mutex);

      // Increment our self-counted ref count by one.
      _refCount++;
      return jsi::Value::undefined();
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "incrementRefCount"), 0, incrementRefCount);
  }
  if (name == "decrementRefCount") {
    auto decrementRefCount = JSI_FUNC {
      // Lock Frame so it cannot be deallocated while we access it
      std::lock_guard lock(this->_mutex);

      // Decrement our self-counted ref count by one.
      _refCount--;
      if (_refCount < 1) {
        // ARC will then delete the Frame and the underlying Frame Buffer.
        this->frame = nil;
      }

      return jsi::Value::undefined();
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "decrementRefCount"), 0, decrementRefCount);
  }
  if (name == "toArrayBuffer") {
    auto toArrayBuffer = JSI_FUNC {
      // Lock Frame so it cannot be deallocated while we access it
      std::lock_guard lock(this->_mutex);

      // Get CPU readable Pixel Buffer from Frame and write it to a jsi::ArrayBuffer
      Frame* frame = this->getFrame();
      auto pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
      auto bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);
      auto height = CVPixelBufferGetHeight(pixelBuffer);

      auto arraySize = bytesPerRow * height;

      static constexpr auto ARRAYBUFFER_CACHE_PROP_NAME = "__frameArrayBufferCache";
      if (!runtime.global().hasProperty(runtime, ARRAYBUFFER_CACHE_PROP_NAME)) {
        auto mutableBuffer = std::make_shared<vision::MutableRawBuffer>(arraySize);
        jsi::ArrayBuffer arrayBuffer(runtime, mutableBuffer);
        runtime.global().setProperty(runtime, ARRAYBUFFER_CACHE_PROP_NAME, std::move(arrayBuffer));
      }

      auto arrayBufferCache = runtime.global().getPropertyAsObject(runtime, ARRAYBUFFER_CACHE_PROP_NAME);
      auto arrayBuffer = arrayBufferCache.getArrayBuffer(runtime);

      if (arrayBuffer.size(runtime) != arraySize) {
        auto mutableBuffer = std::make_shared<vision::MutableRawBuffer>(arraySize);
        arrayBuffer = jsi::ArrayBuffer(runtime, mutableBuffer);
        runtime.global().setProperty(runtime, ARRAYBUFFER_CACHE_PROP_NAME, arrayBuffer);
      }

      CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
      auto buffer = (uint8_t*)CVPixelBufferGetBaseAddress(pixelBuffer);
      memcpy(arrayBuffer.data(runtime), buffer, arraySize);
      CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);

      return arrayBuffer;
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "toArrayBuffer"), 0, toArrayBuffer);
  }

  if (name == "isValid") {
    // Lock Frame so it cannot be deallocated while we access it
    std::lock_guard lock(this->_mutex);

    // unsafely access the Frame and try to see if it's valid
    Frame* frame = this->frame;
    return jsi::Value(frame != nil && frame.isValid);
  }
  if (name == "width") {
    // Lock Frame so it cannot be deallocated while we access it
    std::lock_guard lock(this->_mutex);

    Frame* frame = this->getFrame();
    return jsi::Value((double)frame.width);
  }
  if (name == "height") {
    // Lock Frame so it cannot be deallocated while we access it
    std::lock_guard lock(this->_mutex);

    Frame* frame = this->getFrame();
    return jsi::Value((double)frame.height);
  }
  if (name == "orientation") {
    // Lock Frame so it cannot be deallocated while we access it
    std::lock_guard lock(this->_mutex);

    Frame* frame = this->getFrame();
    NSString* orientation = [NSString stringWithParsed:frame.orientation];
    return jsi::String::createFromUtf8(runtime, orientation.UTF8String);
  }
  if (name == "isMirrored") {
    // Lock Frame so it cannot be deallocated while we access it
    std::lock_guard lock(this->_mutex);

    Frame* frame = this->getFrame();
    return jsi::Value(frame.isMirrored);
  }
  if (name == "timestamp") {
    // Lock Frame so it cannot be deallocated while we access it
    std::lock_guard lock(this->_mutex);

    Frame* frame = this->getFrame();
    return jsi::Value(frame.timestamp);
  }
  if (name == "pixelFormat") {
    // Lock Frame so it cannot be deallocated while we access it
    std::lock_guard lock(this->_mutex);

    Frame* frame = this->getFrame();
    return jsi::String::createFromUtf8(runtime, frame.pixelFormat.UTF8String);
  }
  if (name == "bytesPerRow") {
    // Lock Frame so it cannot be deallocated while we access it
    std::lock_guard lock(this->_mutex);

    Frame* frame = this->getFrame();
    return jsi::Value((double)frame.bytesPerRow);
  }
  if (name == "planesCount") {
    // Lock Frame so it cannot be deallocated while we access it
    std::lock_guard lock(this->_mutex);

    Frame* frame = this->getFrame();
    return jsi::Value((double)frame.planesCount);
  }

  // fallback to base implementation
  return HostObject::get(runtime, propName);
}

#undef JSI_FUNC
