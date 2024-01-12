//
// Created by Marc Rousavy on 12.01.24.
//

#pragma once

#include "JSITypedArray.h"
#include "JVisionCameraProxy.h"
#include <fbjni/ByteBuffer.h>
#include <fbjni/fbjni.h>
#include <jni.h>

namespace vision {

using namespace facebook;

class JSharedArray : public jni::HybridClass<JSharedArray> {
public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessor/TypedArray;";
  static void registerNatives();

public:
  static jni::local_ref<JSharedArray::javaobject> create(jsi::Runtime& runtime, TypedArrayBase array);

public:
  jni::local_ref<jni::JByteBuffer> getByteBuffer();
  std::shared_ptr<TypedArrayBase> getTypedArray();

private:
  jni::global_ref<jni::JByteBuffer> wrapInByteBuffer(jsi::Runtime& runtime, std::shared_ptr<TypedArrayBase> typedArray);

private:
  static auto constexpr TAG = "TypedArray";
  friend HybridBase;
  jni::global_ref<javaobject> _javaPart;
  jni::global_ref<jni::JByteBuffer> _byteBuffer;
  std::shared_ptr<TypedArrayBase> _array;

private:
  explicit JSharedArray(jsi::Runtime& runtime, std::shared_ptr<TypedArrayBase> array);
  explicit JSharedArray(const jni::alias_ref<jhybridobject>& javaThis, const jni::alias_ref<JVisionCameraProxy::javaobject>& proxy,
                        int dataType, int size);
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> javaThis,
                                                jni::alias_ref<JVisionCameraProxy::javaobject> proxy, jint dataType, jint size);
};

} // namespace vision
