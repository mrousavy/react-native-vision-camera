//
// Created by Marc on 19/06/2021.
//

#pragma once

#include <jsi/jsi.h>
#include <jni.h>
#include <fbjni/fbjni.h>
#include <android/log.h>

#include "JImageProxy.h"

namespace vision {

using namespace facebook;

class JSI_EXPORT JImageProxyHostObject : public jsi::HostObject {
public:
  explicit JImageProxyHostObject(jni::local_ref<jobject> boxedImage) {
    if (boxedImage->isInstanceOf(JImageProxy::javaClassLocal())) {
      frame = reinterpret_cast<JImageProxy *>(boxedImage.get());
    } else {
      throw std::runtime_error("Tried to initialize JImageProxyHostObject with an object not of type ImageProxy.");
    }
  }

  ~JImageProxyHostObject();

public:
  jsi::Value get(jsi::Runtime &, const jsi::PropNameID &name) override;

  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;

public:
  JImageProxy* frame;

private:
  static auto constexpr TAG = "VisionCamera";
};

} // namespace vision