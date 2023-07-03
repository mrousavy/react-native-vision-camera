//
// Created by Marc Rousavy on 05.05.23.
//

#pragma once

#include <memory>

#include <jni.h>
#include <fbjni/fbjni.h>

#include <SkiaOpenGLRenderer.h>
#include <android/native_window.h>
#include <GLES2/gl2.h>
#include <EGL/egl.h>

namespace vision {

using namespace facebook;

class SkiaPreviewView: public jni::HybridClass<SkiaPreviewView> {
public:
    static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/preview/SkiaPreviewView;";
    static auto constexpr TAG = "VisionCamera";
    static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);
    static void registerNatives();
    ~SkiaPreviewView();

private:
    friend HybridBase;
    jni::global_ref<SkiaPreviewView::javaobject> _javaPart;
    std::unique_ptr<RNSkia::SkiaOpenGLRenderer> _skiaRenderer;
    int _width, _height;
    ANativeWindow* _inputSurface;
    ANativeWindow* _outputSurface;
    EGLContext _eglContext;
    EGLDisplay _eglDisplay;
    EGLSurface _inputEGLSurface = EGL_NO_SURFACE, _outputEGLSurface = EGL_NO_SURFACE;

    sk_sp<GrDirectContext> _context;

    void onSizeChanged(jint width, jint height);
    void setInputSurface(jni::alias_ref<jobject> surface);
    void setOutputSurface(jni::alias_ref<jobject> surface);
    void onFrame(jni::alias_ref<JFrame> frame);

    void ensureOpenGLInitialized();

    explicit SkiaPreviewView(jni::alias_ref<SkiaPreviewView::jhybridobject> jThis);
};

} // namespace vision
