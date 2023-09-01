//
// Created by Marc on 19/06/2021.
//

#include "FrameHostObject.h"

#include <fbjni/fbjni.h>
#include <jni.h>

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

  if (name == "incrementRefCount") {
    jsi::HostFunctionType incrementRefCount = [=](jsi::Runtime& runtime,
                                                  const jsi::Value& thisArg,
                                                  const jsi::Value* args,
                                                  size_t count) -> jsi::Value {
      // Increment retain count by one.
      this->frame->cthis()->incrementRefCount();
      return jsi::Value::undefined();
    };
    return jsi::Function::createFromHostFunction(runtime,
                                                 jsi::PropNameID::forUtf8(runtime, "incrementRefCount"),
                                                 0,
                                                 incrementRefCount);
  }
  if (name == "decrementRefCount") {
    auto decrementRefCount = [=](jsi::Runtime& runtime,
                                 const jsi::Value& thisArg,
                                 const jsi::Value* args,
                                 size_t count) -> jsi::Value {
      // Decrement retain count by one. If the retain count is zero, the Frame gets closed.
      this->frame->cthis()->decrementRefCount();
      return jsi::Value::undefined();
    };
    return jsi::Function::createFromHostFunction(runtime,
                                                 jsi::PropNameID::forUtf8(runtime, "decrementRefCount"),
                                                 0,
                                                 decrementRefCount);
  }
  if (name == "toString") {
    jsi::HostFunctionType toString = [=](jsi::Runtime& runtime,
                                         const jsi::Value& thisArg,
                                         const jsi::Value* args,
                                         size_t count) -> jsi::Value {
      if (!this->frame) {
        return jsi::String::createFromUtf8(runtime, "[closed frame]");
      }
      auto width = this->frame->cthis()->getWidth();
      auto height = this->frame->cthis()->getHeight();
      auto str = std::to_string(width) + " x " + std::to_string(height) + " Frame";
      return jsi::String::createFromUtf8(runtime, str);
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "toString"), 0, toString);
  }
  if (name == "toArrayBuffer") {
    jsi::HostFunctionType toArrayBuffer = [=](jsi::Runtime& runtime,
                                              const jsi::Value& thisArg,
                                              const jsi::Value* args,
                                              size_t count) -> jsi::Value {
      size_t size = frame->cthis()->pixelsSize;
      uint8_t* pixels = frame->cthis()->pixels;

      static constexpr auto ARRAYBUFFER_CACHE_PROP_NAME = "__frameArrayBufferCache";
      if (!runtime.global().hasProperty(runtime, ARRAYBUFFER_CACHE_PROP_NAME)) {
        vision::TypedArray<vision::TypedArrayKind::Uint8ClampedArray> arrayBuffer(runtime, size);
        runtime.global().setProperty(runtime, ARRAYBUFFER_CACHE_PROP_NAME, arrayBuffer);
      }

      // Get from global JS cache
      auto arrayBufferCache = runtime.global().getPropertyAsObject(runtime, ARRAYBUFFER_CACHE_PROP_NAME);
      auto arrayBuffer = vision::getTypedArray(runtime, arrayBufferCache).get<vision::TypedArrayKind::Uint8ClampedArray>(runtime);
      if (arrayBuffer.size(runtime) != size) {
        arrayBuffer = vision::TypedArray<vision::TypedArrayKind::Uint8ClampedArray>(runtime, size);
        runtime.global().setProperty(runtime, ARRAYBUFFER_CACHE_PROP_NAME, arrayBuffer);
      }

      // directly write to C++ JSI ArrayBuffer
      auto destinationBuffer = arrayBuffer.data(runtime);
      memcpy(destinationBuffer, pixels, sizeof(uint8_t) * size);

      return arrayBuffer;
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "toArrayBuffer"), 0, toArrayBuffer);
  }

  if (name == "isValid") {
    return jsi::Value(this->frame && this->frame->cthis()->getIsValid());
  }
  if (name == "width") {
    return jsi::Value(this->frame->cthis()->getWidth());
  }
  if (name == "height") {
    return jsi::Value(this->frame->cthis()->getHeight());
  }
  if (name == "isMirrored") {
    return jsi::Value(this->frame->cthis()->getIsMirrored());
  }
  if (name == "orientation") {
    auto string = this->frame->cthis()->getOrientation();
    return jsi::String::createFromUtf8(runtime, string->toStdString());
  }
  if (name == "pixelFormat") {
    auto string = this->frame->cthis()->getPixelFormat();
    return jsi::String::createFromUtf8(runtime, string->toStdString());
  }
  if (name == "timestamp") {
    return jsi::Value(static_cast<double>(this->frame->cthis()->getTimestamp()));
  }
  if (name == "bytesPerRow") {
    return jsi::Value(this->frame->cthis()->getBytesPerRow());
  }

  // fallback to base implementation
  return HostObject::get(runtime, propName);
}

} // namespace vision
