//
// Created by Marc on 19/06/2021.
//

#pragma once

#include <jsi/jsi.h>
#include <jni.h>
#include <fbjni/fbjni.h>
#include <vector>
#include <string>

#include "java-bindings/JImageProxy.h"

namespace vision {

using namespace facebook;

class JSI_EXPORT FrameHostObject : public jsi::HostObject {
 public:
  explicit FrameHostObject(jni::alias_ref<JImageProxy::javaobject> image);
  ~FrameHostObject();

 public:
  jsi::Value get(jsi::Runtime &, const jsi::PropNameID &name) override;
  void set(jsi::Runtime&, const jsi::PropNameID& propName, const jsi::Value& value) override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;

  void close();

 public:
  jni::global_ref<JImageProxy> frame;

 private:
  static auto constexpr TAG = "VisionCamera";

  void assertIsFrameStrong(jsi::Runtime& runtime, const std::string& accessedPropName) const; // NOLINT(runtime/references)
  size_t _refCount = 0;
};

} // namespace vision
