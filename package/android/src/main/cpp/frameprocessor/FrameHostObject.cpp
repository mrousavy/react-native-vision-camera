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

#include "FinalAction.h"

namespace vision {

using namespace facebook;

FrameHostObject::FrameHostObject(const jni::alias_ref<JFrame::javaobject>& frame) : frame(make_global(frame)) {}

FrameHostObject::~FrameHostObject() {
  // Hermes GC might destroy HostObjects on an arbitrary Thread which might not be
  // connected to the JNI environment. To make sure fbjni can properly destroy
  // the Java method, we connect to a JNI environment first.
  jni::ThreadScope::WithClassLoader([&] { frame.reset(); });
}

std::vector<jsi::PropNameID> FrameHostObject::getPropertyNames(jsi::Runtime& rt) {
  std::vector<jsi::PropNameID> result;
  // Ref Management
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("isValid")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("incrementRefCount")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("decrementRefCount")));

  if (frame != nullptr && frame->getIsValid()) {
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

#define JSI_FUNC [=](jsi::Runtime & runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value

jsi::Value FrameHostObject::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);

  if (name == "incrementRefCount") {
    jsi::HostFunctionType incrementRefCount = JSI_FUNC {
      // Increment retain count by one.
      this->frame->incrementRefCount();
      return jsi::Value::undefined();
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "incrementRefCount"), 0, incrementRefCount);
  }
  if (name == "decrementRefCount") {
    auto decrementRefCount = JSI_FUNC {
      // Decrement retain count by one. If the retain count is zero, the Frame gets closed.
      this->frame->decrementRefCount();
      return jsi::Value::undefined();
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "decrementRefCount"), 0, decrementRefCount);
  }
  if (name == "toString") {
    jsi::HostFunctionType toString = JSI_FUNC {
      if (!this->frame) {
        return jsi::String::createFromUtf8(runtime, "[closed frame]");
      }
      auto width = this->frame->getWidth();
      auto height = this->frame->getHeight();
      auto format = this->frame->getPixelFormat();
      auto formatString = format->getUnionValue();
      auto str = std::to_string(width) + " x " + std::to_string(height) + " " + formatString->toString() + " Frame";
      return jsi::String::createFromUtf8(runtime, str);
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "toString"), 0, toString);
  }
  if (name == "toArrayBuffer") {
    jsi::HostFunctionType toArrayBuffer = JSI_FUNC {
#if __ANDROID_API__ >= 26
      AHardwareBuffer* hardwareBuffer = this->frame->getHardwareBuffer();
      AHardwareBuffer_acquire(hardwareBuffer);
      finally([&]() { AHardwareBuffer_release(hardwareBuffer); });

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
      finally([&]() {
        int result = AHardwareBuffer_unlock(hardwareBuffer, nullptr);
        if (result != 0) {
          throw jsi::JSError(runtime, "Failed to lock HardwareBuffer for reading!");
        }
      });

      // directly write to C++ JSI ArrayBuffer
      auto destinationBuffer = arrayBuffer.data(runtime);
      memcpy(destinationBuffer, buffer, sizeof(uint8_t) * size);

      return arrayBuffer;
#else
      throw jsi::JSError(runtime, "Frame.toArrayBuffer() is only available if minSdkVersion is set to 26 or higher!");
#endif
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "toArrayBuffer"), 0, toArrayBuffer);
  }

  if (name == "isValid") {
    return jsi::Value(this->frame && this->frame->getIsValid());
  }
  if (name == "width") {
    return jsi::Value(this->frame->getWidth());
  }
  if (name == "height") {
    return jsi::Value(this->frame->getHeight());
  }
  if (name == "isMirrored") {
    return jsi::Value(this->frame->getIsMirrored());
  }
  if (name == "orientation") {
    auto orientation = this->frame->getOrientation();
    auto string = orientation->getUnionValue();
    return jsi::String::createFromUtf8(runtime, string->toStdString());
  }
  if (name == "pixelFormat") {
    auto pixelFormat = this->frame->getPixelFormat();
    auto string = pixelFormat->getUnionValue();
    return jsi::String::createFromUtf8(runtime, string->toStdString());
  }
  if (name == "timestamp") {
    return jsi::Value(static_cast<double>(this->frame->getTimestamp()));
  }
  if (name == "bytesPerRow") {
    return jsi::Value(this->frame->getBytesPerRow());
  }
  if (name == "planesCount") {
    return jsi::Value(this->frame->getPlanesCount());
  }

  // fallback to base implementation
  return HostObject::get(runtime, propName);
}

#undef JSI_FUNC

} // namespace vision
