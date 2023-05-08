//
// Created by Marc Rousavy on 05.05.23.
//

#include "SkiaPreviewSurface.h"

#include <android/log.h>

#include "SkImage.h"
#include "SkSurface.h"
#include <android/native_window.h>
#include <android/native_window_jni.h>

namespace vision {

using TSelf = jni::local_ref<SkiaPreviewSurface::jhybriddata>;

SkiaPreviewSurface::SkiaPreviewSurface(jni::alias_ref<SkiaPreviewSurface::jhybridobject> jThis,
                                       jint inputWidth, jint inputHeight,
                                       jni::alias_ref<jobject> outputSurface)
        : _javaPart(jni::make_global(jThis)) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Creating SkiaPreviewSurface...");

    auto renderer = std::make_shared<RNSkia::SkiaOpenGLRenderer>(outputSurface.get());

    auto x = RNSkia::MakeOffscreenGLSurface(1, 2);

    // Create OpenGL context
    _context = GrDirectContext::MakeGL();
    if (_context == nullptr) {
        throw std::runtime_error("Failed to create an OpenGL GrContext!");
    }

    // Create Input Surface
    auto imageInfo = SkImageInfo:: Make(inputWidth,
                                        inputHeight,
                                        SkColorType::kBGRA_8888_SkColorType,
                                        SkAlphaType::kOpaque_SkAlphaType);
    _inputSurface = SkSurface::MakeRenderTarget(_context.get(),
                                                SkBudgeted::kNo,
                                                imageInfo);
    if (!_inputSurface) {
        throw std::runtime_error("Failed to create input Skia Surface!");
    }

    auto nativeWindow = ANativeWindow_fromSurface(jni::Environment::current(), outputSurface.get());


    EGLint att[] = {EGL_RENDERABLE_TYPE,
                    EGL_OPENGL_ES2_BIT,
                    EGL_SURFACE_TYPE,
                    EGL_PBUFFER_BIT,
                    EGL_ALPHA_SIZE,
                    8,
                    EGL_BLUE_SIZE,
                    8,
                    EGL_GREEN_SIZE,
                    8,
                    EGL_RED_SIZE,
                    8,
                    EGL_DEPTH_SIZE,
                    0,
                    EGL_STENCIL_SIZE,
                    0,
                    EGL_NONE};

    EGLint numConfigs;
    EGLConfig eglConfig;
    if (!eglChooseConfig(eglGetCurrentDisplay(), att, &eglConfig, 1, &numConfigs) ||
        numConfigs == 0) {
        throw std::runtime_error("Failed to get EGL Config! " + std::to_string(eglGetError()));
    }

    // Create the opengl surface
    _outputGLSurface = eglCreateWindowSurface(eglGetCurrentDisplay(),
                                        eglConfig,
                                        nativeWindow, nullptr);

    GLint buffer;
    glGetIntegerv(GL_FRAMEBUFFER_BINDING, &buffer);

    GLint stencil;
    glGetIntegerv(GL_STENCIL_BITS, &stencil);

    GLint samples;
    glGetIntegerv(GL_SAMPLES, &samples);

    auto maxSamples = _context->maxSurfaceSampleCountForColorType(kRGBA_8888_SkColorType);

    if (samples > maxSamples)
        samples = maxSamples;

    GrGLFramebufferInfo fbInfo;
    fbInfo.fFBOID = buffer;
    fbInfo.fFormat = 0x8058;

    auto renderTarget = GrBackendRenderTarget(400, 700, samples, stencil, fbInfo);

    _outputSkiaSurface = SkSurface::MakeFromBackendRenderTarget(
            _context.get(), renderTarget, kBottomLeft_GrSurfaceOrigin,
            kRGBA_8888_SkColorType, nullptr, nullptr,
            nullptr,
            nullptr);
}

TSelf SkiaPreviewSurface::initHybrid(jni::alias_ref<jhybridobject> jThis,
                                     jint inputWidth, jint inputHeight,
                                     jni::alias_ref<jobject> outputSurface) {
    return makeCxxInstance(jThis, inputWidth, inputHeight, outputSurface);
}

void SkiaPreviewSurface::registerNatives() {
    registerHybrid({
       makeNativeMethod("initHybrid", SkiaPreviewSurface::initHybrid),
       makeNativeMethod("getInputSurfaceTextureId", SkiaPreviewSurface::getInputSurfaceTextureId),
       makeNativeMethod("setOutputSize", SkiaPreviewSurface::setOutputSize),
       makeNativeMethod("drawFrame", SkiaPreviewSurface::drawFrame),
    });
}

void SkiaPreviewSurface::drawFrame() {
    __android_log_write(ANDROID_LOG_INFO, TAG,
                        "drawFrame(...)");


    _context->resetContext();

    auto canvas = _outputSkiaSurface->getCanvas();

    //auto snapshot = _inputSurface->makeImageSnapshot();
    //canvas->drawImage(snapshot, 0, 0);

    SkPaint paint;
    paint.setColor(SkColors::kRed);
    auto rect = SkRect::MakeXYWH(100, 120, 180, 140);
    canvas->drawRect(rect, paint);


    _outputSkiaSurface->flushAndSubmit();

    if (!eglSwapBuffers(eglGetCurrentDisplay(), _outputGLSurface)) {
        throw std::runtime_error("eglSwapBuffers failed: " + std::to_string(eglGetError()));
    }
}

jint SkiaPreviewSurface::getInputSurfaceTextureId() {
    auto renderTarget = _inputSurface->getBackendRenderTarget(SkSurface::kFlushWrite_BackendHandleAccess);
    if (!renderTarget.isValid()) {
        throw std::runtime_error("Tried to get texture ID of an invalid input surface!");
    }
    GrGLFramebufferInfo info;
    info.fFBOID = -1;
    renderTarget.getGLFramebufferInfo(&info);
    if (info.fFBOID == -1) {
        throw std::runtime_error("Input Surface has invalid backend render target ID (-1)!");
    }
    return static_cast<jint>(info.fFBOID);
}

void SkiaPreviewSurface::setOutputSize(jint width, jint height) {
    // TODO: Set output size
}


} // namespace vision
