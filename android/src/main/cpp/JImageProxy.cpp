//
// Created by Marc Rousavy on 22.06.21.
//

#include "JImageProxy.h"

#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;
using namespace jni;

int JImageProxy::getWidth() {
  static auto getWidthMethod = getClass()->getMethod<jint()>("getWidth");
  return getWidthMethod(javaClassLocal());
}

int JImageProxy::getHeight() {
  static auto getWidthMethod = getClass()->getMethod<jint()>("getHeight");
  return getWidthMethod(javaClassLocal());
}

bool JImageProxy::getIsValid() {
  static auto getImageMethod = getClass()->getMethod<JImageProxy::javaobject()>("getImage");
  auto image = getImageMethod(javaClassLocal());

  static auto getHardwareBufferMethod = findClassLocal("android/media/Image")->getMethod<jobject()>("getHardwareBuffer");
  try {
    getHardwareBufferMethod(image.get());
    return true;
  } catch (...) {
    // function throws if the image is not active anymore
    return false;
  }
}

}
