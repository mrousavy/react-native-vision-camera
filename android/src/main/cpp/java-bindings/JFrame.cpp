//
// Created by Marc on 21.07.2023.
//

#include "JFrame.h"

#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;
using namespace jni;

int JFrame::getWidth() const {
  static const auto getWidthMethod = getClass()->getMethod<jint()>("getWidth");
  return getWidthMethod(self());
}

int JFrame::getHeight() const {
  static const auto getWidthMethod = getClass()->getMethod<jint()>("getHeight");
  return getWidthMethod(self());
}

bool JFrame::getIsValid() const {
  static const auto getIsValidMethod = getClass()->getMethod<jboolean()>("getIsValid");
  return getIsValidMethod(self());
}

bool JFrame::getIsMirrored() const {
  static const auto getIsMirroredMethod = getClass()->getMethod<jboolean()>("getIsMirrored");
  return getIsMirroredMethod(self());
}

jlong JFrame::getTimestamp() const {
  static const auto getTimestampMethod = getClass()->getMethod<jlong()>("getTimestamp");
  return getTimestampMethod(self());
}

local_ref<JString> JFrame::getOrientation() const {
  static const auto getOrientationMethod = getClass()->getMethod<JString()>("getOrientation");
  return getOrientationMethod(self());
}

int JFrame::getPlanesCount() const {
  static const auto getPlanesCountMethod = getClass()->getMethod<jint()>("getPlanesCount");
  return getPlanesCountMethod(self());
}

int JFrame::getBytesPerRow() const {
  static const auto getBytesPerRowMethod = getClass()->getMethod<jint()>("getBytesPerRow");
  return getBytesPerRowMethod(self());
}

local_ref<JArrayByte> JFrame::toByteArray() const {
  static const auto toByteArrayMethod = getClass()->getMethod<JArrayByte()>("toByteArray");
  return toByteArrayMethod(self());
}

void JFrame::close() {
  static const auto closeMethod = getClass()->getMethod<void()>("close");
  closeMethod(self());
}

} // namespace vision
