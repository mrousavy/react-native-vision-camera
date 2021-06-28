//
// Created by Marc Rousavy on 28.06.21.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

struct JImage : public facebook::jni::JavaClass<JImage> {
  static constexpr auto kJavaDescriptor = "Landroid/media/Image;";

 public:
  bool getIsValid();
};

} // namespace vision
