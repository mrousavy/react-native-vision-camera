//
// Created by Marc Rousavy on 29.12.23.
//

#pragma once

#include <fbjni/fbjni.h>
#include <jni.h>

namespace vision {

using namespace facebook;
using namespace jni;

struct JJSUnionValue : public JavaClass<JJSUnionValue> {
  static constexpr auto kJavaDescriptor = "Lcom/mrousavy/camera/core/types/JSUnionValue;";

  local_ref<JString> getUnionValue() {
    const auto getUnionValueMethod = getClass()->getMethod<JString()>("getUnionValue");
    return getUnionValueMethod(self());
  }
};

} // namespace vision
