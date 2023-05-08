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

    _renderer = std::make_unique<RNSkia::SkiaOpenGLRenderer>(outputSurface.get());
    _inputSurface = RNSkia::MakeOffscreenGLSurface(inputWidth, inputHeight);
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

    _renderer->run([](SkCanvas* canvas) {
        SkPaint paint;
        paint.setColor(SkColors::kRed);
        auto rect = SkRect::MakeXYWH(100, 120, 180, 140);
        canvas->drawRect(rect, paint);
    }, _outputWidth, _outputHeight);
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
    _outputWidth = width;
    _outputHeight = height;
}


} // namespace vision
