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
#import "WKTJsiHostObject.h"

#import "../../cpp/JSITypedArray.h"

std::vector<jsi::PropNameID> FrameHostObject::getPropertyNames(jsi::Runtime& rt) {
  std::vector<jsi::PropNameID> result;
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
  if (name == "toArrayBuffer") {
    auto toArrayBuffer = JSI_HOST_FUNCTION_LAMBDA {
      auto pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
      auto bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);
      auto height = CVPixelBufferGetHeight(pixelBuffer);

      auto arraySize = bytesPerRow * height;

      static constexpr auto ARRAYBUFFER_CACHE_PROP_NAME = "__frameArrayBufferCache";
      if (!runtime.global().hasProperty(runtime, ARRAYBUFFER_CACHE_PROP_NAME)) {
        vision::TypedArray<vision::TypedArrayKind::Uint8ClampedArray> arrayBuffer(runtime, arraySize);
        runtime.global().setProperty(runtime, ARRAYBUFFER_CACHE_PROP_NAME, arrayBuffer);
      }

      auto arrayBufferCache = runtime.global().getPropertyAsObject(runtime, ARRAYBUFFER_CACHE_PROP_NAME);
      auto arrayBuffer = vision::getTypedArray(runtime, arrayBufferCache).get<vision::TypedArrayKind::Uint8ClampedArray>(runtime);

      if (arrayBuffer.size(runtime) != arraySize) {
        arrayBuffer = vision::TypedArray<vision::TypedArrayKind::Uint8ClampedArray>(runtime, arraySize);
        runtime.global().setProperty(runtime, ARRAYBUFFER_CACHE_PROP_NAME, arrayBuffer);
      }

      CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
      auto buffer = (uint8_t*) CVPixelBufferGetBaseAddress(pixelBuffer);
      arrayBuffer.updateUnsafe(runtime, buffer, arraySize);
      CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);

      return arrayBuffer;
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "toArrayBuffer"), 0, toArrayBuffer);
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
  if (name == "orientation") {
    switch (frame.orientation) {
      case UIImageOrientationUp:
      case UIImageOrientationUpMirrored:
        return jsi::String::createFromUtf8(runtime, "portrait");
      case UIImageOrientationDown:
      case UIImageOrientationDownMirrored:
        return jsi::String::createFromUtf8(runtime, "portrait-upside-down");
      case UIImageOrientationLeft:
      case UIImageOrientationLeftMirrored:
        return jsi::String::createFromUtf8(runtime, "landscape-left");
      case UIImageOrientationRight:
      case UIImageOrientationRightMirrored:
        return jsi::String::createFromUtf8(runtime, "landscape-right");
    }
  }
  if (name == "isMirrored") {
    switch (frame.orientation) {
      case UIImageOrientationUp:
      case UIImageOrientationDown:
      case UIImageOrientationLeft:
      case UIImageOrientationRight:
        return jsi::Value(false);
      case UIImageOrientationDownMirrored:
      case UIImageOrientationUpMirrored:
      case UIImageOrientationLeftMirrored:
      case UIImageOrientationRightMirrored:
        return jsi::Value(true);
    }
  }
  if (name == "timestamp") {
    auto timestamp = CMSampleBufferGetPresentationTimeStamp(frame.buffer);
    auto seconds = static_cast<double>(CMTimeGetSeconds(timestamp));
    return jsi::Value(seconds * 1000.0);
  }
  if (name == "pixelFormat") {
    auto format = CMSampleBufferGetFormatDescription(frame.buffer);
    auto mediaType = CMFormatDescriptionGetMediaSubType(format);
    switch (mediaType) {
      case kCVPixelFormatType_32BGRA:
        return jsi::String::createFromUtf8(runtime, "rgb");
      case kCVPixelFormatType_420YpCbCr8BiPlanarFullRange:
      case kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange:
        return jsi::String::createFromUtf8(runtime, "yuv");
      default:
        return jsi::String::createFromUtf8(runtime, "unknown");
    }
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
