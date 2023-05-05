//
// Created by Marc Rousavy on 05.05.23.
//

#pragma once

#include <memory>

#include <jni.h>
#include <fbjni/fbjni.h>

#include <rnskia-android/SkiaOpenGLRenderer.h>

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

    void onSurfaceTextureAvailable(const jni::alias_ref<jobject>& surface, jint width, jint height);
    void onSurfaceTextureSizeChanged(const jni::alias_ref<jobject>& surface, jint width, jint height);
    void onSurfaceTextureDestroyed(const jni::alias_ref<jobject>& surface);
    void onSurfaceTextureUpdated(const jni::alias_ref<jobject>& surface);

    explicit SkiaPreviewView(jni::alias_ref<SkiaPreviewView::jhybridobject> jThis);
};

} // namespace vision
