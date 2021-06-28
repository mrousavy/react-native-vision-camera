//
// Created by Marc on 19/06/2021.
//

#include "JImageProxyHostObject.h"
#include <android/log.h>
#include <vector>
#include <string>

namespace vision {

std::vector<jsi::PropNameID> JImageProxyHostObject::getPropertyNames(jsi::Runtime& rt) {
  std::vector<jsi::PropNameID> result;
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("toString")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("isValid")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("isReady")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("width")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("height")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("bytesPerRow")));
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("planesCount")));
  return result;
}

jsi::Value JImageProxyHostObject::get(jsi::Runtime& runtime, const jsi::PropNameID& propNameId) {
  auto name = propNameId.utf8(runtime);

  if (name == "toString") {
    auto toString = [this] (jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
      auto width = this->frame->getWidth();
      auto height = this->frame->getHeight();
      auto str = std::to_string(width) + " x " + std::to_string(height) + " Frame";
      return jsi::String::createFromUtf8(runtime, str);
    };
    return jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, "toString"), 0, toString);
  }

  if (name == "isValid") {
    return jsi::Value(this->frame->getIsValid());
  }
  if (name == "isReady") {
    return jsi::Value(this->frame->getIsValid());
  }
  if (name == "width") {
    return jsi::Value(this->frame->getWidth());
  }
  if (name == "height") {
    return jsi::Value(this->frame->getHeight());
  }
  if (name == "bytesPerRow") {
    return jsi::Value(this->frame->getBytesPerRow());
  }
  if (name == "planesCount") {
    return jsi::Value(this->frame->getPlaneCount());
  }

  return jsi::Value::undefined();
}


JImageProxyHostObject::~JImageProxyHostObject() {
  __android_log_write(ANDROID_LOG_INFO, TAG, "Destroying JImageProxyHostObject...");
}

} // namespace vision
