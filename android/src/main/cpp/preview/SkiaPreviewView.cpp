//
// Created by Marc Rousavy on 05.05.23.
//

#include "SkiaPreviewView.h"

#include <android/log.h>

#include "SkImage.h"
#include "SkSurface.h"

#include <android/native_window.h>
#include <android/native_window_jni.h>
#include <android/surface_texture.h>
#include <android/surface_texture_jni.h>
#include <GLES2/gl2.h>
#include <EGL/egl.h>
namespace vision {

using TSelf = jni::local_ref<SkiaPreviewView::jhybriddata>;

SkiaPreviewView::SkiaPreviewView(jni::alias_ref<SkiaPreviewView::jhybridobject> jThis)
    : _javaPart(jni::make_global(jThis)) {
    _outputEGLSurface = EGL_NO_SURFACE;
}

TSelf SkiaPreviewView::initHybrid(jni::alias_ref<jhybridobject> jThis) {
    return makeCxxInstance(jThis);
}

void SkiaPreviewView::registerNatives() {
    registerHybrid({
       makeNativeMethod("initHybrid", SkiaPreviewView::initHybrid),
       makeNativeMethod("onSizeChanged", SkiaPreviewView::onSizeChanged),
       makeNativeMethod("setInputSurface", SkiaPreviewView::setInputSurface),
       makeNativeMethod("setOutputSurface", SkiaPreviewView::setOutputSurface),
       makeNativeMethod("onFrame", SkiaPreviewView::onFrame),
    });
}

void SkiaPreviewView::onSizeChanged(jint width, jint height) {
    __android_log_write(ANDROID_LOG_INFO, TAG,
                        "onSurfaceTextureSizeChanged!");
    _width = width;
    _height = height;
}

void SkiaPreviewView::ensureOpenGLInitialized() {
    if (_outputEGLSurface != EGL_NO_SURFACE) return;

    _eglDisplay = eglGetDisplay(EGL_DEFAULT_DISPLAY);
    if (_eglDisplay == EGL_NO_DISPLAY) {
        throw std::runtime_error("Failed to get EGL Display! " + std::to_string(glGetError()));
    }
    EGLint major, minor;
    if (!eglInitialize(_eglDisplay, &major, &minor)) {
        throw std::runtime_error("Failed to initialize EGL! " + std::to_string(glGetError()));
    }
    EGLint att[] = {EGL_RENDERABLE_TYPE, EGL_OPENGL_ES2_BIT,
                    EGL_SURFACE_TYPE, EGL_WINDOW_BIT,
                    EGL_ALPHA_SIZE, 8,
                    EGL_BLUE_SIZE, 8,
                    EGL_GREEN_SIZE, 8,
                    EGL_RED_SIZE, 8,
                    EGL_NONE};
    EGLint numConfigs;
    EGLConfig eglConfig;
    if (!eglChooseConfig(_eglDisplay, att, &eglConfig, 1, &numConfigs) ||
        numConfigs == 0) {
        throw std::runtime_error("Failed to choose a GL Config! " + std::to_string(glGetError()));
    }
    EGLint contextAttribs[] = {EGL_CONTEXT_CLIENT_VERSION, 2, EGL_NONE};
    _eglContext = eglCreateContext(_eglDisplay,
                                   eglConfig,
                                   nullptr,
                                   contextAttribs);

    _outputEGLSurface = eglCreateWindowSurface(_eglDisplay,
                                               eglConfig,
                                               _outputSurface,
                                               nullptr);
    if (_outputEGLSurface == EGL_NO_SURFACE) {
        throw std::runtime_error("Failed to initialize EGL Surface! " + std::to_string(glGetError()));
    }
    __android_log_write(ANDROID_LOG_INFO, TAG,
                        "Output Surface initialized!!");
}

void SkiaPreviewView::setInputSurface(jni::alias_ref<jobject> surface) {
    _inputSurface = ANativeWindow_fromSurface(jni::Environment::current(), surface.get());
}

void SkiaPreviewView::setOutputSurface(jni::alias_ref<jobject> surface) {
    _outputSurface = ANativeWindow_fromSurface(jni::Environment::current(), surface.get());
}

void SkiaPreviewView::onFrame(jni::alias_ref<JFrame> frame) {

    __android_log_write(ANDROID_LOG_INFO, TAG,
                        "onFrame(...)");
    ensureOpenGLInitialized();

    eglMakeCurrent(_eglDisplay, _outputEGLSurface, _outputEGLSurface, _eglContext);

    if (_inputSurface != nullptr) {
    }
}

SkiaPreviewView::~SkiaPreviewView() {
}

} // namespace vision
