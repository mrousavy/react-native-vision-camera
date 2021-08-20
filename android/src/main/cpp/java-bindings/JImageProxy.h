//
// Created by Marc on 19/06/2021.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

struct JImageProxy : public facebook::jni::JavaClass<JImageProxy> {
  static constexpr auto kJavaDescriptor = "Landroidx/camera/core/ImageProxy;";

 public:
  int getWidth();
  int getHeight();
  bool getIsValid();
  int getPlanesCount();
  int getBytesPerRow();
  void close();
};

} // namespace vision
