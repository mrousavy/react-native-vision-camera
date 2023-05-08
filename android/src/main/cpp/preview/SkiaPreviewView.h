//
// Created by Marc Rousavy on 05.05.23.
//

#pragma once

#include <memory>

#include <jni.h>
#include <fbjni/fbjni.h>

#include <SkiaOpenGLRenderer.h>

namespace vision {

using namespace facebook;

class SkiaPreviewView: public jni::HybridClass<SkiaPreviewView> {
public:
    static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/preview/SkiaPreviewView;";
    static auto constexpr TAG = "VisionCamera";
    static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);
    static void registerNatives();

private:
    friend HybridBase;
    jni::global_ref<SkiaPreviewView::javaobject> _javaPart;
    std::unique_ptr<RNSkia::SkiaOpenGLRenderer> _skiaRenderer;
    int _width, _height;
    sk_sp<GrDirectContext> _context;

    void onSizeChanged(jint width, jint height);

    explicit SkiaPreviewView(jni::alias_ref<SkiaPreviewView::jhybridobject> jThis);
};

} // namespace vision
