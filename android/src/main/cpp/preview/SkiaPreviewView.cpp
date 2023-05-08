//
// Created by Marc Rousavy on 05.05.23.
//

#include "SkiaPreviewView.h"

#include <android/log.h>

#include "SkImage.h"
#include "SkSurface.h"


namespace vision {

using TSelf = jni::local_ref<SkiaPreviewView::jhybriddata>;

SkiaPreviewView::SkiaPreviewView(jni::alias_ref<SkiaPreviewView::jhybridobject> jThis)
    : _javaPart(jni::make_global(jThis)) {
    _context = GrDirectContext::MakeGL();
    if (_context == nullptr) {
        throw std::runtime_error("Failed to create an OpenGL GrContext!");
    }
}

TSelf SkiaPreviewView::initHybrid(jni::alias_ref<jhybridobject> jThis) {
    return makeCxxInstance(jThis);
}

void SkiaPreviewView::registerNatives() {
    registerHybrid({
       makeNativeMethod("initHybrid", SkiaPreviewView::initHybrid),
       makeNativeMethod("createSurface", SkiaPreviewView::createSurface),
       makeNativeMethod("onSizeChanged", SkiaPreviewView::onSizeChanged),
       makeNativeMethod("onDrawFrame", SkiaPreviewView::onDrawFrame),
    });
}

jint SkiaPreviewView::createSurface(jint width, jint height) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Creating %i x %i Skia surface...", width, height);

    auto info = SkImageInfo:: Make(width, height, SkColorType::kBGRA_8888_SkColorType, SkAlphaType::kOpaque_SkAlphaType);
    auto surface = SkSurface::MakeRenderTarget(_context.get(), SkBudgeted::kNo, info);
    if (!surface) {
        throw std::runtime_error("Failed to create Skia Surface!");
    }

    auto renderTarget = surface->getBackendRenderTarget(SkSurface::BackendHandleAccess::kFlushWrite_BackendHandleAccess);
    if (!renderTarget.isValid()) {
        throw std::runtime_error("Skia Surface is not backed by a render target!");
    }
    GrGLFramebufferInfo frameBufferInfo;
    renderTarget.getGLFramebufferInfo(&frameBufferInfo);

    __android_log_print(ANDROID_LOG_INFO, TAG, "Surface created! Texture ID: %i", frameBufferInfo.fFBOID);

    surface.release();

    return frameBufferInfo.fFBOID;
}

void SkiaPreviewView::onSizeChanged(jint width, jint height) {
    __android_log_write(ANDROID_LOG_INFO, TAG,
                        "onSurfaceTextureSizeChanged!");
    _width = width;
    _height = height;
}

void SkiaPreviewView::onDrawFrame() {
    __android_log_write(ANDROID_LOG_INFO, TAG,
                        "onSurfaceTextureUpdated!");
    if (_skiaRenderer != nullptr) {
        _skiaRenderer->run([](SkCanvas* canvas) {
            __android_log_write(ANDROID_LOG_INFO, TAG,
                                "draw callback executing...");
            SkRect rect = SkRect::MakeXYWH(300, 300, 300, 400);
            SkPaint paint(SkColors::kRed);
            canvas->drawRect(rect, paint);
            canvas->flush();
        }, _width, _height);
    }
}



int SkiaPreviewView::createOpenGLContext() {

}


} // namespace vision
