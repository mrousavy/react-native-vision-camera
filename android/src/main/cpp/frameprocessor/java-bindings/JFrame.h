//
// Created by Marc on 21.07.2023.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>
#include <fbjni/ByteBuffer.h>
#include <android/hardware_buffer.h>
#include <android/hardware_buffer_jni.h>
#include <mutex>

namespace vision {

using namespace facebook;

class JFrame : public jni::HybridClass<JFrame> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessor/Frame;";
  static void registerNatives();
  static jni::local_ref<JFrame::javaobject> create(int width,
                                                   int height,
                                                   int bytesPerRow,
                                                   long timestamp,
                                                   const std::string& orientation,
                                                   bool isMirrored);

  ~JFrame() noexcept;

 protected:
  friend HybridBase;
  explicit JFrame(int width,
                  int height,
                  int bytesPerRow,
                  long timestamp,
                  const std::string& orientation,
                  bool isMirrored);

 public:
  int getWidth() { return _width; }
  int getHeight() { return _height; }
  int getBytesPerRow() { return _bytesPerRow; }
  jlong getTimestamp() { return _timestamp; }
  jni::local_ref<jni::JString> getOrientation() { return jni::make_jstring(_orientation); }
  bool getIsMirrored() { return _isMirrored; }

  // TODO: Can this be something other than RGB?
  jni::local_ref<jni::JString> getPixelFormat() { return jni::make_jstring("rgb"); }

  bool getIsValid();
  jni::local_ref<jni::JByteBuffer> getByteBuffer();
  void incrementRefCount();
  void decrementRefCount();
  void close();

  // Backing byte data
  uint8_t* pixels = nullptr;
  size_t pixelsSize = 0;

 private:
  // Frame info
  int _width = 0;
  int _height = 0;
  int _bytesPerRow = 0;
  long _timestamp = 0;
  std::string _orientation = {};
  bool _isMirrored = false;

  // Ref-counting
  int _refCount = 0;
  bool _isClosed = false;
  std::mutex _mutex;
};

} // namespace vision
