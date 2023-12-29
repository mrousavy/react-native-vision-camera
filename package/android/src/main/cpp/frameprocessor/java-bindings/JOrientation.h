//
// Created by Marc Rousavy on 29.12.23.
//

#pragma once

#include <fbjni/fbjni.h>
#include <jni.h>
#include "JJSUnionValue.h"

namespace vision {

using namespace facebook;
using namespace jni;

struct JOrientation: public JavaClass<JOrientation, JJSUnionValue> {
    static constexpr auto kJavaDescriptor = "Lcom/mrousavy/camera/types/Orientation;";
};

} // namespace vision
