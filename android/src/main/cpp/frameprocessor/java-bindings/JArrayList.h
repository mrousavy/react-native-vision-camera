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
template <typename E = jobject>
struct JArrayList : JavaClass<JArrayList<E>, JList<E>> {
  constexpr static auto kJavaDescriptor = "Ljava/util/ArrayList;";
};

} // namespace vision
