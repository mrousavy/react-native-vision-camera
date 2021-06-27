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
  static const auto getWidthMethod = getClass()->getMethod<jint()>("getWidth");
  return getWidthMethod(javaClassLocal());
}

int JImageProxy::getHeight() {
  static const auto getWidthMethod = getClass()->getMethod<jint()>("getHeight");
  return getWidthMethod(javaClassLocal());
}

bool JImageProxy::getIsValid() {
  static const auto getImageMethod = getClass()->getMethod<JImageProxy::javaobject()>("getImage");
  auto image = getImageMethod(javaClassLocal());

  static const auto getHardwareBufferMethod = findClassLocal("android/media/Image")->getMethod<jobject()>("getHardwareBuffer");
  try {
    getHardwareBufferMethod(image.get());
    return true;
  } catch (...) {
    // function throws if the image is not active anymore
    return false;
  }
}

int JImageProxy::getPlaneCount() {
  static const auto getPlanesMethod = getClass()->getMethod<JArrayClass<jobject>()>("getPlanes");
  auto planes = getPlanesMethod(javaClassLocal());
  return planes->size();
}

int JImageProxy::getBytesPerRow() {
  static const auto getPlanesMethod = getClass()->getMethod<JArrayClass<jobject>()>("getPlanes");
  auto planes = getPlanesMethod(javaClassLocal());
  auto firstPlane = planes->getElement(0);

  static const auto getRowStrideMethod = findClassLocal("android/media/Image$PlaneProxy")->getMethod<int()>("getRowStride");
  return getRowStrideMethod(firstPlane.get());
}

} // namespace vision
