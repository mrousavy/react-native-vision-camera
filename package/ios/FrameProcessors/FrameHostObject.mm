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
  result.push_back(jsi::PropNameID::forUtf8(rt, "isValid"));
  result.push_back(jsi::PropNameID::forUtf8(rt, "incrementRefCount"));
  result.push_back(jsi::PropNameID::forUtf8(rt, "decrementRefCount"));

  if (_frame != nil && _frame.isValid) {
    // Frame Properties
    result.push_back(jsi::PropNameID::forUtf8(rt, "width"));
    result.push_back(jsi::PropNameID::forUtf8(rt, "height"));
    result.push_back(jsi::PropNameID::forUtf8(rt, "bytesPerRow"));
    result.push_back(jsi::PropNameID::forUtf8(rt, "planesCount"));
    result.push_back(jsi::PropNameID::forUtf8(rt, "orientation"));
    result.push_back(jsi::PropNameID::forUtf8(rt, "isMirrored"));
    result.push_back(jsi::PropNameID::forUtf8(rt, "timestamp"));
    result.push_back(jsi::PropNameID::forUtf8(rt, "pixelFormat"));
    // Conversion
    result.push_back(jsi::PropNameID::forUtf8(rt, "toString"));
    result.push_back(jsi::PropNameID::forUtf8(rt, "toArrayBuffer"));
    result.push_back(jsi::PropNameID::forUtf8(rt, "getNativeBuffer"));
    result.push_back(jsi::PropNameID::forUtf8(rt, "withBaseClass"));
  }

  return result;
}

Frame* FrameHostObject::getFrame() {
  if (!_frame.isValid) [[unlikely]] {
    throw std::runtime_error("Frame is already closed! "
                             "Are you trying to access the Image data outside of a Frame Processor's lifetime?\n"
                             "- If you want to use `console.log(frame)`, use `console.log(frame.toString())` instead.\n"
                             "- If you want to do async processing, use `runAsync(...)` instead.\n"
                             "- If you want to use runOnJS, increment it's ref-count: `frame.incrementRefCount()`");
  }
  return _frame;
}

#define JSI_FUNC [=](jsi::Runtime & runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value

jsi::Value FrameHostObject::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);

  // Properties
  if (name == "width") {
    Frame* frame = getFrame();
    return jsi::Value((double)frame.width);
  }
  if (name == "height") {
    Frame* frame = getFrame();
    return jsi::Value((double)frame.height);
  }
  if (name == "orientation") {
    Frame* frame = getFrame();
    NSString* orientation = [NSString stringWithParsed:frame.orientation];
    return jsi::String::createFromUtf8(runtime, orientation.UTF8String);
  }
  if (name == "isMirrored") {
    Frame* frame = getFrame();
    return jsi::Value(frame.isMirrored);
  }
  if (name == "timestamp") {
    Frame* frame = getFrame();
    return jsi::Value(frame.timestamp);
  }
  if (name == "pixelFormat") {
    Frame* frame = getFrame();
    return jsi::String::createFromUtf8(runtime, frame.pixelFormat.UTF8String);
  }
  if (name == "isValid") {
    // unsafely access the Frame and try to see if it's valid
    Frame* frame = _frame;
    return jsi::Value(frame != nil && frame.isValid);
  }
  if (name == "bytesPerRow") {
    Frame* frame = getFrame();
    return jsi::Value((double)frame.bytesPerRow);
  }
  if (name == "planesCount") {
    Frame* frame = getFrame();
    return jsi::Value((double)frame.planesCount);
  }

  // Internal methods
  if (name == "incrementRefCount") {
    auto incrementRefCount = JSI_FUNC {
      [_frame incrementRefCount];
      return jsi::Value::undefined();
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "incrementRefCount"), 0, incrementRefCount);
  }
  if (name == "decrementRefCount") {
    auto decrementRefCount = JSI_FUNC {
      [_frame decrementRefCount];
      return jsi::Value::undefined();
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "decrementRefCount"), 0, decrementRefCount);
  }

  // Conversion methods
  if (name == "getNativeBuffer") {
    auto getNativeBuffer = JSI_FUNC {
      // Box-cast to uintptr (just 64-bit address)
      Frame* frame = getFrame();
      CMSampleBufferRef sampleBuffer = frame.buffer;
      CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
      uintptr_t pointer = reinterpret_cast<uintptr_t>(pixelBuffer);
      jsi::HostFunctionType deleteFunc = [=](jsi::Runtime& runtime, const jsi::Value& thisArg, const jsi::Value* args,
                                             size_t count) -> jsi::Value {
        // no-op as memory is managed by the parent Frame (decrementRefCount())
        return jsi::Value::undefined();
      };

      jsi::Object result(runtime);
      result.setProperty(runtime, "pointer", jsi::BigInt::fromUint64(runtime, pointer));
      result.setProperty(runtime, "delete",
                         jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "delete"), 0, deleteFunc));
      return result;
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "getNativeBuffer"), 0, getNativeBuffer);
  }
  if (name == "toArrayBuffer") {
    auto toArrayBuffer = JSI_FUNC {
      // Get CPU readable Pixel Buffer from Frame and write it to a jsi::ArrayBuffer
      Frame* frame = getFrame();
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
  if (name == "toString") {
    auto toString = JSI_FUNC {
      // Print debug description (width, height)
      Frame* frame = getFrame();
      NSMutableString* string = [NSMutableString stringWithFormat:@"%lu x %lu %@ Frame", frame.width, frame.height, frame.pixelFormat];
      return jsi::String::createFromUtf8(runtime, string.UTF8String);
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "toString"), 0, toString);
  }
  if (name == "withBaseClass") {
    auto withBaseClass = JSI_FUNC {
      jsi::Object newBaseClass = arguments[0].asObject(runtime);
      _baseClass = std::make_unique<jsi::Object>(std::move(newBaseClass));
      return jsi::Object::createFromHostObject(runtime, shared_from_this());
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "withBaseClass"), 1, withBaseClass);
  }

  if (_baseClass != nullptr) {
    // look up value in base class if we have a custom base class
    jsi::Value value = _baseClass->getProperty(runtime, name.c_str());
    if (!value.isUndefined()) {
      return value;
    }
  }

  // fallback to base implementation
  return HostObject::get(runtime, propName);
}

#undef JSI_FUNC
