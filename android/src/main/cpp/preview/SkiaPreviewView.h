//
// Created by Marc Rousavy on 05.05.23.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>

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
    jni::global_ref<SkiaPreviewView::javaobject> javaPart_;
    jni::global_ref<jobject> textureView_;

    void onSurfaceTextureAvailable(const jni::alias_ref<jobject>& surface, jint width, jint height);
    void onSurfaceTextureSizeChanged(const jni::alias_ref<jobject>& surface, jint width, jint height);
    jboolean onSurfaceTextureDestroyed(const jni::alias_ref<jobject>& surface);
    void onSurfaceTextureUpdated(const jni::alias_ref<jobject>& surface);

    explicit SkiaPreviewView(jni::alias_ref<SkiaPreviewView::jhybridobject> jThis) : javaPart_(jni::make_global(jThis))
    {}
};

} // namespace vision
