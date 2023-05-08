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
    });
}

void SkiaPreviewView::onSizeChanged(jint width, jint height) {
    __android_log_write(ANDROID_LOG_INFO, TAG,
                        "onSurfaceTextureSizeChanged!");
    _width = width;
    _height = height;
}

} // namespace vision
