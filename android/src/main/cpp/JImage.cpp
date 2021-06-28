//
// Created by Marc Rousavy on 28.06.21.
//

#include "JImage.h"

#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;
using namespace jni;


bool JImage::getIsValid() {
  static const auto getNativeContextMethod = getClass()->getMethod<jlong()>("getNativeContext");
  try {
    getNativeContextMethod(javaClassLocal());
    return true;
  } catch (...) {
    // function throws if the image is not active anymore
    return false;
  }
}

} // namespace vision