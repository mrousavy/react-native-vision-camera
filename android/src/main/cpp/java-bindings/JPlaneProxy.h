//
// Created by Marc Rousavy on 20.08.21.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

struct JPlaneProxy : public facebook::jni::JavaClass<JPlaneProxy> {
  static constexpr auto kJavaDescriptor = "Landroidx/camera/core/ImageProxy$JPlaneProxy;";

public:
  int getRowStride();
};

} // namespace vision