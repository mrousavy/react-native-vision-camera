//
// Created by Marc on 21.07.2023.
//

#include "JFrame.h"

#include <jni.h>
#include <fbjni/fbjni.h>
#include <fbjni/ByteBuffer.h>

namespace vision {

using namespace facebook;

void JFrame::registerNatives() {
  registerHybrid({
    makeNativeMethod("getWidth", JFrame::getWidth),
    makeNativeMethod("getHeight", JFrame::getHeight),
    makeNativeMethod("getBytesPerRow", JFrame::getBytesPerRow),
    makeNativeMethod("getTimestamp", JFrame::getTimestamp),
    makeNativeMethod("getOrientation", JFrame::getOrientation),
    makeNativeMethod("getIsMirrored", JFrame::getIsMirrored),
    makeNativeMethod("getPixelFormat", JFrame::getPixelFormat),
    makeNativeMethod("getByteBuffer", JFrame::getByteBuffer),
    makeNativeMethod("getIsValid", JFrame::getIsValid),
  });
}

jni::local_ref<JFrame::javaobject> JFrame::create(int width,
                                                  int height,
                                                  int bytesPerRow,
                                                  long timestamp,
                                                  const std::string& orientation,
                                                  bool isMirrored,
                                                  uint8_t* pixels,
                                                  size_t pixelsSize) {
  return newObjectCxxArgs(width,
    height,
    bytesPerRow,
    timestamp,
    orientation,
    isMirrored,
    pixels,
    pixelsSize);
}

JFrame::JFrame(int width,
               int height,
               int bytesPerRow,
               long timestamp,
               const std::string& orientation,
               bool isMirrored,
               uint8_t* pixels,
               size_t pixelsSize) {
  _width = width;
  _height = height;
  _bytesPerRow = bytesPerRow;
  _timestamp = timestamp;
  _orientation = orientation;
  _isMirrored = isMirrored;
  _refCount = 1;
  this->pixels = pixels;
  this->pixelsSize = pixelsSize;
}

JFrame::~JFrame() noexcept {
  close();
}

bool JFrame::getIsValid() {
  return _refCount > 0 && !_isClosed;
}

jni::local_ref<jni::JByteBuffer> JFrame::getByteBuffer() {
  if (!getIsValid()) {
    [[unlikely]]
    throw std::runtime_error("Frame is no longer valid, cannot access getByteBuffer!");
  }
  return jni::JByteBuffer::wrapBytes(pixels, pixelsSize);
}

void JFrame::incrementRefCount() {
  std::unique_lock lock(_mutex);
  _refCount++;
}

void JFrame::decrementRefCount() {
  std::unique_lock lock(_mutex);
  _refCount--;
  if (_refCount <= 0) {
    this->close();
  }
}

void JFrame::close() {
  _isClosed = true;
}

} // namespace vision
