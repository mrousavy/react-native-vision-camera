//
// Created by Marc Rousavy on 12.01.24.
//

#include "JTypedArray.h"

namespace vision {

using namespace facebook;

JTypedArray::JTypedArray(const jni::alias_ref<JTypedArray::jhybridobject>& javaThis,
                         const jni::alias_ref<JVisionCameraProxy::javaobject>& proxy,
                         int dataType, int size) {
    _javaPart = jni::make_global(javaThis);
    _proxy = jni::make_global(proxy);

    jsi::Runtime& runtime = *proxy->cthis()->getJSRuntime();
    _array = std::make_shared<TypedArrayBase>(runtime, size, TypedArrayKind::Uint8Array);
}

void JTypedArray::registerNatives() {
    registerHybrid({makeNativeMethod("initHybrid", JTypedArray::initHybrid)});
}

jni::local_ref<JTypedArray::jhybriddata> JTypedArray::initHybrid(jni::alias_ref<jhybridobject> javaThis,
                                                                 jni::alias_ref<JVisionCameraProxy::javaobject> proxy,
                                                                 jint type,
                                                                 jint size) {
    return makeCxxInstance(javaThis, proxy, type, size);
}

} // vision