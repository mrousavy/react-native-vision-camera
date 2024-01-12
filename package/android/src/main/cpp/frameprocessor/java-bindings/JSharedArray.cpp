//
// Created by Marc Rousavy on 12.01.24.
//

#include "JSharedArray.h"
#include <android/log.h>

namespace vision {

using namespace facebook;

TypedArrayKind getTypedArrayKind(int unsafeEnumValue) {
  return static_cast<TypedArrayKind>(unsafeEnumValue);
}

jni::local_ref<JSharedArray::javaobject> JSharedArray::create(jsi::Runtime& runtime, TypedArrayBase array) {
  return newObjectCxxArgs(runtime, std::make_shared<TypedArrayBase>(std::move(array)));
}

jni::global_ref<jni::JByteBuffer> JSharedArray::wrapInByteBuffer(jsi::Runtime& runtime, std::shared_ptr<TypedArrayBase> typedArray) {
  jsi::ArrayBuffer arrayBuffer = typedArray->getBuffer(runtime);
  __android_log_print(ANDROID_LOG_INFO, TAG, "Wrapping ArrayBuffer in a JNI ByteBuffer...");
  auto byteBuffer = jni::JByteBuffer::wrapBytes(arrayBuffer.data(runtime), arrayBuffer.size(runtime));
  __android_log_print(ANDROID_LOG_INFO, TAG, "Successfully created TypedArray (JNI Size: %i)!", byteBuffer->getDirectSize());
  return jni::make_global(byteBuffer);
}

JSharedArray::JSharedArray(jsi::Runtime& runtime, std::shared_ptr<TypedArrayBase> array) {
  _array = array;
  _byteBuffer = wrapInByteBuffer(runtime, _array);
}

JSharedArray::JSharedArray(const jni::alias_ref<JSharedArray::jhybridobject>& javaThis,
                           const jni::alias_ref<JVisionCameraProxy::javaobject>& proxy, int dataType, int size) {
  _javaPart = jni::make_global(javaThis);

#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
  jsi::Runtime& runtime = proxy->cthis()->getWorkletRuntime();
#else
  jsi::Runtime& runtime = *proxy->cthis()->getJSRuntime();
#endif
  TypedArrayKind kind = getTypedArrayKind(dataType);
  __android_log_print(ANDROID_LOG_INFO, TAG, "Allocating ArrayBuffer with size %i and type %i...", size, dataType);
  _array = std::make_shared<TypedArrayBase>(runtime, size, kind);
  _byteBuffer = wrapInByteBuffer(runtime, _array);
}

void JSharedArray::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", JSharedArray::initHybrid),
      makeNativeMethod("getByteBuffer", JSharedArray::getByteBuffer),
  });
}

jni::local_ref<jni::JByteBuffer> JSharedArray::getByteBuffer() {
  return jni::make_local(_byteBuffer);
}

std::shared_ptr<TypedArrayBase> JSharedArray::getTypedArray() {
  return _array;
}

jni::local_ref<JSharedArray::jhybriddata> JSharedArray::initHybrid(jni::alias_ref<jhybridobject> javaThis,
                                                                   jni::alias_ref<JVisionCameraProxy::javaobject> proxy, jint type,
                                                                   jint size) {
  return makeCxxInstance(javaThis, proxy, type, size);
}

} // namespace vision
