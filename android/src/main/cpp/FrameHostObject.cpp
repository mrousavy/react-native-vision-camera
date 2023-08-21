//
// Created by Marc on 19/06/2021.
//

#include "FrameHostObject.h"

#include <android/log.h>
#include <fbjni/fbjni.h>
#include <jni.h>

#include <react-native-worklets-core/WKTJsiHostObject.h>
#include "JSITypedArray.h"

#include <vector>
#include <string>

namespace vision {

using namespace facebook;

FrameHostObject::FrameHostObject(const jni::alias_ref<JFrame::javaobject>& frame): frame(make_global(frame)) { }

FrameHostObject::~FrameHostObject() {
  // Hermes' Garbage Collector (Hades GC) calls destructors on a separate Thread
  // which might not be attached to JNI. Ensure that we use the JNI class loader when
  // deallocating the `frame` HybridClass, because otherwise JNI cannot call the Java
  // destroy() function.
  jni::ThreadScope::WithClassLoader([&] { frame.reset(); });
}

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
      if (!this->frame) {
        return jsi::String::createFromUtf8(runtime, "[closed frame]");
      }
      auto width = this->frame->getWidth();
      auto height = this->frame->getHeight();
      auto str = std::to_string(width) + " x " + std::to_string(height) + " Frame";
      return jsi::String::createFromUtf8(runtime, str);
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "toString"), 0, toString);
  }
  if (name == "toArrayBuffer") {
    auto toArrayBuffer = JSI_HOST_FUNCTION_LAMBDA {
      auto buffer = this->frame->toByteArray();
      auto arraySize = buffer->size();

      static constexpr auto ARRAYBUFFER_CACHE_PROP_NAME = "__frameArrayBufferCache";
      if (!runtime.global().hasProperty(runtime, ARRAYBUFFER_CACHE_PROP_NAME)) {
        vision::TypedArray<vision::TypedArrayKind::Uint8ClampedArray> arrayBuffer(runtime, arraySize);
        runtime.global().setProperty(runtime, ARRAYBUFFER_CACHE_PROP_NAME, arrayBuffer);
      }

      // Get from global JS cache
      auto arrayBufferCache = runtime.global().getPropertyAsObject(runtime, ARRAYBUFFER_CACHE_PROP_NAME);
      auto arrayBuffer = vision::getTypedArray(runtime, arrayBufferCache).get<vision::TypedArrayKind::Uint8ClampedArray>(runtime);
      if (arrayBuffer.size(runtime) != arraySize) {
        arrayBuffer = vision::TypedArray<vision::TypedArrayKind::Uint8ClampedArray>(runtime, arraySize);
        runtime.global().setProperty(runtime, ARRAYBUFFER_CACHE_PROP_NAME, arrayBuffer);
      }

      // directly write to C++ JSI ArrayBuffer
      auto destinationBuffer = arrayBuffer.data(runtime);
      buffer->getRegion(0,
                        static_cast<jint>(arraySize),
                        reinterpret_cast<jbyte*>(destinationBuffer));

      return arrayBuffer;
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "toArrayBuffer"), 0, toArrayBuffer);
  }
  if (name == "incrementRefCount") {
    auto incrementRefCount = JSI_HOST_FUNCTION_LAMBDA {
      // Increment retain count by one.
      this->frame->incrementRefCount();
      return jsi::Value::undefined();
    };
    return jsi::Function::createFromHostFunction(runtime,
                                                 jsi::PropNameID::forUtf8(runtime, "incrementRefCount"),
                                                 0,
                                                 incrementRefCount);
  }

  if (name == "decrementRefCount") {
    auto decrementRefCount = JSI_HOST_FUNCTION_LAMBDA {
      // Decrement retain count by one. If the retain count is zero, the Frame gets closed.
      this->frame->decrementRefCount();
      return jsi::Value::undefined();
    };
    return jsi::Function::createFromHostFunction(runtime,
                                                 jsi::PropNameID::forUtf8(runtime, "decrementRefCount"),
                                                 0,
                                                 decrementRefCount);
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
    auto string = this->frame->getOrientation();
    return jsi::String::createFromUtf8(runtime, string->toStdString());
  }
  if (name == "pixelFormat") {
    auto string = this->frame->getPixelFormat();
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

} // namespace vision
