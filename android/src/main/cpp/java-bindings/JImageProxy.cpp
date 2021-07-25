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
  return getWidthMethod(self());
}

int JImageProxy::getHeight() {
  static const auto getWidthMethod = getClass()->getMethod<jint()>("getHeight");
  return getWidthMethod(self());
}

bool JImageProxy::getIsValid() {
  static const auto utilsClass = findClassStatic("com/mrousavy/camera/frameprocessor/ImageProxyUtils");
  static const auto isImageProxyValidMethod = utilsClass->getStaticMethod<jboolean(JImageProxy::javaobject)>("isImageProxyValid");
  return isImageProxyValidMethod(utilsClass, self());
}

int JImageProxy::getPlaneCount() {
  static const auto getPlanesMethod = getClass()->getMethod<JArrayClass<jobject>()>("getPlanes");
  auto planes = getPlanesMethod(self());
  return planes->size();
}

int JImageProxy::getBytesPerRow() {
  static const auto getPlanesMethod = getClass()->getMethod<JArrayClass<jobject>()>("getPlanes");
  auto planes = getPlanesMethod(self());
  auto firstPlane = planes->getElement(0);

  static const auto getRowStrideMethod = findClassLocal("android/media/Image$PlaneProxy")->getMethod<int()>("getRowStride");
  return getRowStrideMethod(firstPlane.get());
}

void JImageProxy::close() {
  static const auto closeMethod = getClass()->getMethod<void()>("close");
  closeMethod(self());
}

} // namespace vision
