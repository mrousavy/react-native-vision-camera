//
// Created by Marc on 21.07.2023.
//

#include "JFrame.h"

#include "JOrientation.h"
#include "JPixelFormat.h"
#include <fbjni/fbjni.h>
#include <jni.h>

#include <android/hardware_buffer_jni.h>

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

local_ref<JOrientation> JFrame::getOrientation() const {
  static const auto getOrientationMethod = getClass()->getMethod<JOrientation()>("getOrientation");
  return getOrientationMethod(self());
}

local_ref<JPixelFormat> JFrame::getPixelFormat() const {
  static const auto getPixelFormatMethod = getClass()->getMethod<JPixelFormat()>("getPixelFormat");
  return getPixelFormatMethod(self());
}

int JFrame::getPlanesCount() const {
  static const auto getPlanesCountMethod = getClass()->getMethod<jint()>("getPlanesCount");
  return getPlanesCountMethod(self());
}

int JFrame::getBytesPerRow() const {
  static const auto getBytesPerRowMethod = getClass()->getMethod<jint()>("getBytesPerRow");
  return getBytesPerRowMethod(self());
}

#if __ANDROID_API__ >= 26
AHardwareBuffer* JFrame::getHardwareBuffer() const {
  static const auto getHardwareBufferMethod = getClass()->getMethod<jobject()>("getHardwareBufferBoxed");
  auto hardwareBuffer = getHardwareBufferMethod(self());
  return AHardwareBuffer_fromHardwareBuffer(jni::Environment::current(), hardwareBuffer.get());
}
#endif

void JFrame::incrementRefCount() {
  static const auto incrementRefCountMethod = getClass()->getMethod<void()>("incrementRefCount");
  incrementRefCountMethod(self());
}

void JFrame::decrementRefCount() {
  static const auto decrementRefCountMethod = getClass()->getMethod<void()>("decrementRefCount");
  decrementRefCountMethod(self());
}

} // namespace vision
