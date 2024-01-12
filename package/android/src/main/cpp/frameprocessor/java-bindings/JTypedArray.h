//
// Created by Marc Rousavy on 12.01.24.
//

#pragma once

#include <fbjni/fbjni.h>
#include <jni.h>
#include "JSITypedArray.h"
#include "JVisionCameraProxy.h"

namespace vision {

using namespace facebook;

struct JTypedArray : public jni::HybridClass<JTypedArray> {
public:
    static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/frameprocessor/TypedArray;";
    static void registerNatives();

public:

private:
    friend HybridBase;
    jni::global_ref<javaobject> _javaPart;
    jni::global_ref<JVisionCameraProxy::javaobject> _proxy;
    std::shared_ptr<TypedArrayBase> _array;

private:
    explicit JTypedArray(const jni::alias_ref<jhybridobject>& javaThis,
                         const jni::alias_ref<JVisionCameraProxy::javaobject>& proxy,
                         int dataType,
                         int size);
    static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> javaThis,
                                                  jni::alias_ref<JVisionCameraProxy::javaobject> proxy,
                                                  jint dataType,
                                                  jint size);
};

} // vision
