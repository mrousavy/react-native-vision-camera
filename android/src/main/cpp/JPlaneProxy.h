//
// Created by Marc Rousavy on 29.07.21.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

struct JPlaneProxy : public facebook::jni::JavaClass<JPlaneProxy> {
  static constexpr auto kJavaDescriptor = "Landroidx/camera/core/ImageProxy$PlaneProxy;";

public:
  int getPixelStride();
  uint8_t* getBuffer();
};

} // namespace vision