//
// Created by Marc on 21.07.2023.
//

#pragma once

#include "JOrientation.h"
#include "JPixelFormat.h"
#include <fbjni/fbjni.h>
#include <jni.h>

#include <android/hardware_buffer.h>

namespace vision {

using namespace facebook;
using namespace jni;

struct JFrame : public JavaClass<JFrame> {
  static constexpr auto kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessors/Frame;";

public:
  int getWidth() const;
  int getHeight() const;
  bool getIsValid() const;
  bool getIsMirrored() const;
  int getPlanesCount() const;
  int getBytesPerRow() const;
  jlong getTimestamp() const;
  local_ref<JOrientation> getOrientation() const;
  local_ref<JPixelFormat> getPixelFormat() const;
#if __ANDROID_API__ >= 26
  AHardwareBuffer* getHardwareBuffer() const;
#endif

  void incrementRefCount();
  void decrementRefCount();
};

} // namespace vision
