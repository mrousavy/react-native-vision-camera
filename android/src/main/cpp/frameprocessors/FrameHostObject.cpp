//
// Created by Marc on 19/06/2021.
//

#include "FrameHostObject.h"

#include <fbjni/fbjni.h>
#include <jni.h>

#include "MutableRawBuffer.h"

#include <string>
#include <vector>

#include <android/hardware_buffer.h>
#include <android/hardware_buffer_jni.h>

namespace vision {

using namespace facebook;

FrameHostObject::FrameHostObject(const jni::alias_ref<JFrame::javaobject>& frame) : _frame(make_global(frame)), _baseClass(nullptr) {}

FrameHostObject::~FrameHostObject() {
  // Hermes GC might destroy HostObjects on an arbitrary Thread which might not be
  // connected to the JNI environment. To make sure fbjni can properly destroy
  // the Java method, we connect to a JNI environment first.
  jni::ThreadScope::WithClassLoader([&] { _frame = nullptr; });
}

std::vector<jsi::PropNameID> FrameHostObject::getPropertyNames(jsi::Runtime& rt) {
  std::vector<jsi::PropNameID> result;
  // Ref Management
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("isValid")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("incrementRefCount")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("decrementRefCount")));

  if (_frame->getIsValid()) {
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
    result.push_back(jsi::PropNameID::forUtf8(rt, std::string("getNativeBuffer")));
    result.push_back(jsi::PropNameID::forUtf8(rt, std::string("withBaseClass")));
  }

  return result;
}

#define JSI_FUNC [=](jsi::Runtime & runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value

jsi::Value FrameHostObject::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);

  // Properties
  if (name == "isValid") {
    return jsi::Value(_frame->getIsValid());
  }
  if (name == "width") {
    return jsi::Value(_frame->getWidth());
  }
  if (name == "height") {
    return jsi::Value(_frame->getHeight());
  }
  if (name == "isMirrored") {
    return jsi::Value(_frame->getIsMirrored());
  }
  if (name == "orientation") {
    auto orientation = _frame->getOrientation();
    auto string = orientation->getUnionValue();
    return jsi::String::createFromUtf8(runtime, string->toStdString());
  }
  if (name == "pixelFormat") {
    auto pixelFormat = _frame->getPixelFormat();
    auto string = pixelFormat->getUnionValue();
    return jsi::String::createFromUtf8(runtime, string->toStdString());
  }
  if (name == "timestamp") {
    return jsi::Value(static_cast<double>(_frame->getTimestamp()));
  }
  if (name == "bytesPerRow") {
    return jsi::Value(_frame->getBytesPerRow());
  }
  if (name == "planesCount") {
    return jsi::Value(_frame->getPlanesCount());
  }

  // Internal Methods
  if (name == "incrementRefCount") {
    jsi::HostFunctionType incrementRefCount = JSI_FUNC {
      // Increment retain count by one.
      _frame->incrementRefCount();
      return jsi::Value::undefined();
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "incrementRefCount"), 0, incrementRefCount);
  }
  if (name == "decrementRefCount") {
    auto decrementRefCount = JSI_FUNC {
      // Decrement retain count by one. If the retain count is zero, the Frame gets closed.
      _frame->decrementRefCount();
      return jsi::Value::undefined();
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "decrementRefCount"), 0, decrementRefCount);
  }

  // Conversion methods
  if (name == "getNativeBuffer") {
    jsi::HostFunctionType getNativeBuffer = JSI_FUNC {
#if __ANDROID_API__ >= 26
      AHardwareBuffer* hardwareBuffer = _frame->getHardwareBuffer();
      AHardwareBuffer_acquire(hardwareBuffer);
      uintptr_t pointer = reinterpret_cast<uintptr_t>(hardwareBuffer);
      jsi::HostFunctionType deleteFunc = [=](jsi::Runtime& runtime, const jsi::Value& thisArg, const jsi::Value* args,
                                             size_t count) -> jsi::Value {
        AHardwareBuffer_release(hardwareBuffer);
        return jsi::Value::undefined();
      };

      jsi::Object buffer(runtime);
      buffer.setProperty(runtime, "pointer", jsi::BigInt::fromUint64(runtime, pointer));
      buffer.setProperty(runtime, "delete",
                         jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "delete"), 0, deleteFunc));
      return buffer;
#else
      throw jsi::JSError(runtime, "Cannot get Platform Buffer - getNativeBuffer() requires HardwareBuffers, which are "
                                  "only available on Android API 26 or above. Set your app's minSdk version to 26 and try again.");
#endif
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "getNativeBuffer"), 0, getNativeBuffer);
  }
  if (name == "toArrayBuffer") {
    jsi::HostFunctionType toArrayBuffer = JSI_FUNC {
#if __ANDROID_API__ >= 26
      AHardwareBuffer* hardwareBuffer = _frame->getHardwareBuffer();
      AHardwareBuffer_acquire(hardwareBuffer);

      AHardwareBuffer_Desc bufferDescription;
      AHardwareBuffer_describe(hardwareBuffer, &bufferDescription);
      __android_log_print(ANDROID_LOG_INFO, "Frame", "Converting %i x %i @ %i HardwareBuffer...", bufferDescription.width,
                          bufferDescription.height, bufferDescription.stride);
      size_t size = bufferDescription.height * bufferDescription.stride;

      static constexpr auto ARRAYBUFFER_CACHE_PROP_NAME = "__frameArrayBufferCache";
      if (!runtime.global().hasProperty(runtime, ARRAYBUFFER_CACHE_PROP_NAME)) {
        auto mutableBuffer = std::make_shared<vision::MutableRawBuffer>(size);
        jsi::ArrayBuffer arrayBuffer(runtime, mutableBuffer);
        runtime.global().setProperty(runtime, ARRAYBUFFER_CACHE_PROP_NAME, arrayBuffer);
      }

      // Get from global JS cache
      auto arrayBufferCache = runtime.global().getPropertyAsObject(runtime, ARRAYBUFFER_CACHE_PROP_NAME);
      auto arrayBuffer = arrayBufferCache.getArrayBuffer(runtime);

      if (arrayBuffer.size(runtime) != size) {
        auto mutableBuffer = std::make_shared<vision::MutableRawBuffer>(size);
        arrayBuffer = jsi::ArrayBuffer(runtime, mutableBuffer);
        runtime.global().setProperty(runtime, ARRAYBUFFER_CACHE_PROP_NAME, arrayBuffer);
      }

      // Get CPU access to the HardwareBuffer (&buffer is a virtual temporary address)
      void* buffer;
      int result = AHardwareBuffer_lock(hardwareBuffer, AHARDWAREBUFFER_USAGE_CPU_READ_MASK, -1, nullptr, &buffer);
      if (result != 0) {
        throw jsi::JSError(runtime, "Failed to lock HardwareBuffer for reading!");
      }

      // directly write to C++ JSI ArrayBuffer
      auto destinationBuffer = arrayBuffer.data(runtime);
      memcpy(destinationBuffer, buffer, sizeof(uint8_t) * size);

      // unlock read lock
      AHardwareBuffer_unlock(hardwareBuffer, nullptr);

      // release JNI reference
      AHardwareBuffer_release(hardwareBuffer);

      return arrayBuffer;
#else
      throw jsi::JSError(runtime, "Frame.toArrayBuffer() is only available if minSdkVersion is set to 26 or higher!");
#endif
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "toArrayBuffer"), 0, toArrayBuffer);
  }
  if (name == "toString") {
    jsi::HostFunctionType toString = JSI_FUNC {
      if (!_frame->getIsValid()) {
        return jsi::String::createFromUtf8(runtime, "[closed frame]");
      }
      auto width = _frame->getWidth();
      auto height = _frame->getHeight();
      auto format = _frame->getPixelFormat();
      auto formatString = format->getUnionValue();
      auto str = std::to_string(width) + " x " + std::to_string(height) + " " + formatString->toString() + " Frame";
      return jsi::String::createFromUtf8(runtime, str);
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

} // namespace vision
