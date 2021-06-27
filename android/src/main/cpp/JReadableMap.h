//
// Created by Marc Rousavy on 24.06.21.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;
using namespace jni;

struct JReadableMap : public JavaClass<JReadableMap> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/ReadableMap;";
};

} // namespace vision
