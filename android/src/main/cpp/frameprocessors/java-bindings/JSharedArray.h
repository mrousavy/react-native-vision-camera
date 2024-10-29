//
// Created by Marc Rousavy on 12.01.24.
//

#pragma once

#include "JVisionCameraProxy.h"
#include "MutableJByteBuffer.h"
#include <fbjni/ByteBuffer.h>
#include <fbjni/fbjni.h>
#include <jni.h>

namespace vision {

using namespace facebook;

class JSharedArray : public jni::HybridClass<JSharedArray> {
public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessors/SharedArray;";
  static void registerNatives();

public:
  static jni::local_ref<JSharedArray::javaobject> create(jsi::Runtime& runtime, jsi::ArrayBuffer arrayBuffer);

public:
  jint getSize();
  jni::global_ref<jni::JByteBuffer> getByteBuffer();
  std::shared_ptr<jsi::ArrayBuffer> getArrayBuffer();

private:
  static auto constexpr TAG = "SharedArray";
  friend HybridBase;
  jni::global_ref<javaobject> _javaPart;
  jni::global_ref<jni::JByteBuffer> _byteBuffer;
  std::shared_ptr<jsi::ArrayBuffer> _arrayBuffer;
  int _size;

private:
  explicit JSharedArray(jsi::Runtime& runtime, std::shared_ptr<jsi::ArrayBuffer> arrayBuffer);
  explicit JSharedArray(const jni::alias_ref<jhybridobject>& javaThis, const jni::alias_ref<JVisionCameraProxy::javaobject>& proxy,
                        int size);
  explicit JSharedArray(const jni::alias_ref<jhybridobject>& javaThis, const jni::alias_ref<JVisionCameraProxy::javaobject>& proxy,
                        jni::alias_ref<JByteBuffer> byteBuffer);
  static jni::local_ref<jhybriddata> initHybridAllocate(jni::alias_ref<jhybridobject> javaThis,
                                                        jni::alias_ref<JVisionCameraProxy::javaobject> proxy, jint size);
  static jni::local_ref<jhybriddata> initHybridWrap(jni::alias_ref<jhybridobject> javaThis,
                                                    jni::alias_ref<JVisionCameraProxy::javaobject> proxy,
                                                    jni::alias_ref<JByteBuffer> byteBuffer);
};

} // namespace vision
