//
// Created by Marc on 19/06/2021.
//

#include "JImageProxyHostObject.h"
#include <android/log.h>

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
  __android_log_write(ANDROID_LOG_INFO, TAG, ("Getting prop \"" + name + "\"...").c_str());

  return jsi::Value::undefined();
}


JImageProxyHostObject::~JImageProxyHostObject() {
  __android_log_write(ANDROID_LOG_INFO, TAG, "Destroying JImageProxyHostObject...");
}


}