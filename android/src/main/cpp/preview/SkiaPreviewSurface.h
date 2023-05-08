//
// Created by Marc Rousavy on 08.05.23.
//

#pragma once

#include <memory>

#include <jni.h>
#include <fbjni/fbjni.h>

#include <SkiaOpenGLRenderer.h>

namespace vision {

using namespace facebook;

class SkiaPreviewSurface: public jni::HybridClass<SkiaPreviewSurface> {
public:
    static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/preview/SkiaPreviewSurface;";
    static auto constexpr TAG = "VisionCamera";
    static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis,
                                                  jint inputWidth, jint inputHeight,
                                                  jni::alias_ref<jobject> outputSurface);
    static void registerNatives();

private:
    friend HybridBase;
    jni::global_ref<SkiaPreviewSurface::javaobject> _javaPart;
    std::unique_ptr<RNSkia::SkiaOpenGLRenderer> _renderer;
    sk_sp<SkSurface> _inputSurface;
    int _outputWidth, _outputHeight;


    void setInputSurface(jni::alias_ref<jobject> surface);
    void setOutputSize(jint width, jint height);
    void drawFrame();

    explicit SkiaPreviewSurface(jni::alias_ref<SkiaPreviewSurface::jhybridobject> jThis,
                                jint inputWidth, jint inputHeight,
                                jni::alias_ref<jobject> outputSurface);
};

} // namespace vision
