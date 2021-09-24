//
// Created by Marc on 19/06/2021.
//

#pragma once

#include <jsi/jsi.h>
#include <jni.h>
#include <fbjni/fbjni.h>
#include <vector>
#include <string>

#include "JImageProxy.h"

namespace vision {

using namespace facebook;

class JSI_EXPORT JImageProxyHostObject : public jsi::HostObject {
 public:
  explicit JImageProxyHostObject(jni::alias_ref<JImageProxy::javaobject> image);
  ~JImageProxyHostObject();

 public:
  jsi::Value get(jsi::Runtime &, const jsi::PropNameID &name) override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;

  void close();

 public:
  jni::local_ref<JImageProxy> frame;

 private:
  static auto constexpr TAG = "VisionCamera";

  void assertIsFrameStrong(jsi::Runtime& runtime, const std::string& accessedPropName) const; // NOLINT(runtime/references)
};

} // namespace vision
