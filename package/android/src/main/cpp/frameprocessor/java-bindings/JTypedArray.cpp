//
// Created by Marc Rousavy on 12.01.24.
//

#include "JTypedArray.h"
#include <android/log.h>

namespace vision {

using namespace facebook;

TypedArrayKind getTypedArrayKind(int unsafeEnumValue) {
    return static_cast<TypedArrayKind>(unsafeEnumValue);
}

jni::local_ref<JTypedArray::javaobject> JTypedArray::create(jsi::Runtime &runtime,
                                                            TypedArrayBase array) {
    return newObjectCxxArgs(runtime, std::make_shared<TypedArrayBase>(std::move(array)));
}

jni::global_ref<jni::JByteBuffer> JTypedArray::wrapInByteBuffer(jsi::Runtime& runtime,
                                                                std::shared_ptr<TypedArrayBase> typedArray) {
    jsi::ArrayBuffer arrayBuffer = typedArray->getBuffer(runtime);
    __android_log_print(ANDROID_LOG_INFO, TAG, "Wrapping ArrayBuffer in a JNI ByteBuffer...");
    auto byteBuffer = jni::JByteBuffer::wrapBytes(arrayBuffer.data(runtime), arrayBuffer.size(runtime));
    __android_log_print(ANDROID_LOG_INFO, TAG, "Successfully created TypedArray (JNI Size: %i)!", byteBuffer->getDirectSize());
    return jni::make_global(byteBuffer);
}

JTypedArray::JTypedArray(jsi::Runtime& runtime, std::shared_ptr<TypedArrayBase> array) {
    _array = array;
    _byteBuffer = wrapInByteBuffer(runtime, _array);
}

JTypedArray::JTypedArray(const jni::alias_ref<JTypedArray::jhybridobject>& javaThis,
                         const jni::alias_ref<JVisionCameraProxy::javaobject>& proxy,
                         int dataType, int size) {
    _javaPart = jni::make_global(javaThis);

    jsi::Runtime& runtime = *proxy->cthis()->getJSRuntime();
    TypedArrayKind kind = getTypedArrayKind(dataType);
    __android_log_print(ANDROID_LOG_INFO, TAG, "Allocating ArrayBuffer with size %i and type %i...", size, dataType);
    _array = std::make_shared<TypedArrayBase>(runtime, size, kind);
    _byteBuffer = wrapInByteBuffer(runtime, _array);
}

void JTypedArray::registerNatives() {
    registerHybrid({
       makeNativeMethod("initHybrid", JTypedArray::initHybrid),
       makeNativeMethod("getByteBuffer", JTypedArray::getByteBuffer),
    });
}

jni::local_ref<jni::JByteBuffer> JTypedArray::getByteBuffer() {
    return jni::make_local(_byteBuffer);
}

std::shared_ptr<TypedArrayBase> JTypedArray::getTypedArray() {
    return _array;
}

jni::local_ref<JTypedArray::jhybriddata> JTypedArray::initHybrid(jni::alias_ref<jhybridobject> javaThis,
                                                                 jni::alias_ref<JVisionCameraProxy::javaobject> proxy,
                                                                 jint type,
                                                                 jint size) {
    return makeCxxInstance(javaThis, proxy, type, size);
}

} // vision