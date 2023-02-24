//
// Created by Marc Rousavy on 22.06.21.
//

#include "JImage.h"

#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;
using namespace jni;

int JImage::getWidth() const {
  static const auto getWidthMethod = getClass()->getMethod<jint()>("getWidth");
  return getWidthMethod(self());
}

int JImage::getHeight() const {
  static const auto getWidthMethod = getClass()->getMethod<jint()>("getHeight");
  return getWidthMethod(self());
}

alias_ref<JClass> getUtilsClass() {
  static const auto ImageUtilsClass = findClassStatic("com/mrousavy/camera/frameprocessor/ImageUtils");
  return ImageUtilsClass;
}

bool JImage::getIsValid() const {
  auto utilsClass = getUtilsClass();
  static const auto isImageValidMethod = utilsClass->getStaticMethod<jboolean(JImage::javaobject)>("isImageValid");
  return isImageValidMethod(utilsClass, self());
}

bool JImage::getIsMirrored() const {
  auto utilsClass = getUtilsClass();
  static const auto isImageMirroredMethod = utilsClass->getStaticMethod<jboolean(JImage::javaobject)>("isImageMirrored");
  return isImageMirroredMethod(utilsClass, self());
}

jlong JImage::getTimestamp() const {
    auto utilsClass = getUtilsClass();
    static const auto getTimestampMethod = utilsClass->getStaticMethod<jlong(JImage::javaobject)>("getTimestamp");
    return getTimestampMethod(utilsClass, self());
}

local_ref<JString> JImage::getOrientation() const {
  auto utilsClass = getUtilsClass();
  static const auto getOrientationMethod = utilsClass->getStaticMethod<JString(JImage::javaobject)>("getOrientation");
  return getOrientationMethod(utilsClass, self());
}

int JImage::getPlanesCount() const {
  auto utilsClass = getUtilsClass();
  static const auto getPlanesCountMethod = utilsClass->getStaticMethod<jint(JImage::javaobject)>("getPlanesCount");
  return getPlanesCountMethod(utilsClass, self());
}

int JImage::getBytesPerRow() const {
  auto utilsClass = getUtilsClass();
  static const auto getBytesPerRowMethod = utilsClass->getStaticMethod<jint(JImage::javaobject)>("getBytesPerRow");
  return getBytesPerRowMethod(utilsClass, self());
}

local_ref<JArrayByte> JImage::toByteArray() const {
  auto utilsClass = getUtilsClass();

  static const auto toByteArrayMethod = utilsClass->getStaticMethod<JArrayByte(JImage::javaobject)>("toByteArray");
  return toByteArrayMethod(utilsClass, self());
}

void JImage::close() {
  static const auto closeMethod = getClass()->getMethod<void()>("close");
  closeMethod(self());
}

} // namespace vision
