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
}

TSelf SkiaPreviewView::initHybrid(jni::alias_ref<jhybridobject> jThis) {
    return makeCxxInstance(jThis);
}

void SkiaPreviewView::registerNatives() {
    registerHybrid({
       makeNativeMethod("initHybrid", SkiaPreviewView::initHybrid),
       makeNativeMethod("onSizeChanged", SkiaPreviewView::onSizeChanged),
       makeNativeMethod("onDrawFrame", SkiaPreviewView::onDrawFrame),
    });
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




} // namespace vision
