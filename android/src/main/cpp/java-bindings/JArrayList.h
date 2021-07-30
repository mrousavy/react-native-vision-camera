//
// Created by Marc Rousavy on 24.06.21.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;
using namespace jni;

// TODO: Remove when fbjni 0.2.3 releases.
struct JArrayList : public JavaClass<JArrayList> {
  static constexpr auto kJavaDescriptor = "Ljava/util/ArrayList;";
};

} // namespace vision
