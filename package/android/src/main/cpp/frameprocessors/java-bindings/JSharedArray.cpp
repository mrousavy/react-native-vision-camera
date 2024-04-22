//
// Created by Marc Rousavy on 12.01.24.
//

#include "JSharedArray.h"
#include <android/log.h>

namespace vision {

using namespace facebook;

jni::local_ref<JSharedArray::javaobject> JSharedArray::create(jsi::Runtime& runtime, jsi::ArrayBuffer arrayBuffer) {
  jni::local_ref<JSharedArray::javaobject> instance = newObjectCxxArgs(runtime, std::make_shared<jsi::ArrayBuffer>(std::move(arrayBuffer)));
  instance->cthis()->_javaPart = jni::make_global(instance);
  return instance;
}

JSharedArray::JSharedArray(jsi::Runtime& runtime, std::shared_ptr<jsi::ArrayBuffer> arrayBuffer) {
  size_t size = arrayBuffer->size(runtime);
  __android_log_print(ANDROID_LOG_INFO, TAG, "Wrapping JSI ArrayBuffer with size %zu...", size);
  jni::local_ref<JByteBuffer> byteBuffer = JByteBuffer::wrapBytes(arrayBuffer->data(runtime), size);

  _arrayBuffer = arrayBuffer;
  _byteBuffer = jni::make_global(byteBuffer);
  _size = size;
}

JSharedArray::JSharedArray(const jni::alias_ref<jhybridobject>& javaThis, const jni::alias_ref<JVisionCameraProxy::javaobject>& proxy,
                           jni::alias_ref<JByteBuffer> byteBuffer) {
  _javaPart = jni::make_global(javaThis);

#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
  jsi::Runtime& runtime = proxy->cthis()->getWorkletRuntime();
#else
  jsi::Runtime& runtime = *proxy->cthis()->getJSRuntime();
#endif
  __android_log_print(ANDROID_LOG_INFO, TAG, "Wrapping Java ByteBuffer with size %zu...", byteBuffer->getDirectSize());
  _byteBuffer = jni::make_global(byteBuffer);
  _size = _byteBuffer->getDirectSize();

  auto mutableByteBuffer = std::make_shared<MutableJByteBuffer>(byteBuffer);
  _arrayBuffer = std::make_shared<jsi::ArrayBuffer>(runtime, std::move(mutableByteBuffer));
}

JSharedArray::JSharedArray(const jni::alias_ref<JSharedArray::jhybridobject>& javaThis,
                           const jni::alias_ref<JVisionCameraProxy::javaobject>& proxy, int size)
    : JSharedArray(javaThis, proxy, JByteBuffer::allocateDirect(size)) {
  __android_log_print(ANDROID_LOG_INFO, TAG, "Allocating SharedArray with size %i...", size);
}

void JSharedArray::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", JSharedArray::initHybridAllocate),
      makeNativeMethod("initHybrid", JSharedArray::initHybridWrap),
      makeNativeMethod("getByteBuffer", JSharedArray::getByteBuffer),
      makeNativeMethod("getSize", JSharedArray::getSize),
  });
}

jni::global_ref<jni::JByteBuffer> JSharedArray::getByteBuffer() {
  return _byteBuffer;
}

std::shared_ptr<jsi::ArrayBuffer> JSharedArray::getArrayBuffer() {
  return _arrayBuffer;
}

jint JSharedArray::getSize() {
  return _size;
}

jni::local_ref<JSharedArray::jhybriddata>
JSharedArray::initHybridAllocate(jni::alias_ref<jhybridobject> javaThis, jni::alias_ref<JVisionCameraProxy::javaobject> proxy, jint size) {
  return makeCxxInstance(javaThis, proxy, size);
}

jni::local_ref<JSharedArray::jhybriddata> JSharedArray::initHybridWrap(jni::alias_ref<jhybridobject> javaThis,
                                                                       jni::alias_ref<JVisionCameraProxy::javaobject> proxy,
                                                                       jni::alias_ref<JByteBuffer> byteBuffer) {
  return makeCxxInstance(javaThis, proxy, byteBuffer);
}

} // namespace vision
