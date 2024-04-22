//
// Created by Marc Rousavy on 29.12.23.
//

#pragma once

#include "JJSUnionValue.h"
#include <fbjni/fbjni.h>
#include <jni.h>

namespace vision {

using namespace facebook;
using namespace jni;

struct JPixelFormat : public JavaClass<JPixelFormat, JJSUnionValue> {
  static constexpr auto kJavaDescriptor = "Lcom/mrousavy/camera/core/types/PixelFormat;";
};

} // namespace vision
