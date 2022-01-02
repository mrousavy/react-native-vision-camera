//
// Created by Marc on 19/06/2021.
//

#include "FrameHostObject.h"
#include <android/log.h>
#include <fbjni/fbjni.h>
#include <jni.h>
#include <vector>
#include <string>

namespace vision {

using namespace facebook;

FrameHostObject::FrameHostObject(jni::alias_ref<JImageProxy::javaobject> image): frame(make_global(image)) { }

FrameHostObject::~FrameHostObject() {
  // Hermes' Garbage Collector (Hades GC) calls destructors on a separate Thread
  // which might not be attached to JNI. Ensure that we use the JNI class loader when
  // deallocating the `frame` HybridClass, because otherwise JNI cannot call the Java
  // destroy() function.
  jni::ThreadScope::WithClassLoader([&] { frame.reset(); });
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
  return result;
}

jsi::Value FrameHostObject::get(jsi::Runtime& runtime, const jsi::PropNameID& propNameId) {
  auto name = propNameId.utf8(runtime);

  if (name == "toString") {
    auto toString = [this] (jsi::Runtime& runtime, const jsi::Value&, const jsi::Value*, size_t) -> jsi::Value {
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
  if (name == "close") {
    auto close = [this] (jsi::Runtime& runtime, const jsi::Value&, const jsi::Value*, size_t) -> jsi::Value {
      if (!this->frame) {
        throw jsi::JSError(runtime, "Trying to close an already closed frame! Did you call frame.close() twice?");
      }
      this->close();
      return jsi::Value::undefined();
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "close"), 0, close);
  }

  if (name == "isValid") {
    return jsi::Value(this->frame && this->frame->getIsValid());
  }
  if (name == "width") {
    this->assertIsFrameStrong(runtime, name);
    return jsi::Value(this->frame->getWidth());
  }
  if (name == "height") {
    this->assertIsFrameStrong(runtime, name);
    return jsi::Value(this->frame->getHeight());
  }
  if (name == "bytesPerRow") {
    this->assertIsFrameStrong(runtime, name);
    return jsi::Value(this->frame->getBytesPerRow());
  }
  if (name == "planesCount") {
    this->assertIsFrameStrong(runtime, name);
    return jsi::Value(this->frame->getPlanesCount());
  }

  return jsi::Value::undefined();
}

void FrameHostObject::assertIsFrameStrong(jsi::Runtime& runtime, const std::string& accessedPropName) const {
  if (!this->frame) {
    auto message = "Cannot get `" + accessedPropName + "`, frame is already closed!";
    throw jsi::JSError(runtime, message.c_str());
  }
}

void FrameHostObject::close() {
  if (this->frame) {
    this->frame->close();
  }
}

} // namespace vision
